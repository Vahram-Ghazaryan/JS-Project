import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
import util from 'util';
if (typeof util.isNullOrUndefined !== 'function') {
    util.isNullOrUndefined = function (d) {
        return d === null || d === undefined;
    };
}

let cachedModel = null;

const loadModel = async () => {
    if (cachedModel) return cachedModel;
    console.log("Loading MobileNet model...");
    const model = await mobilenet.load({
        version: 2,
        alpha: 1.0,
    });
    cachedModel = model;
    return model;
};

const EXCLUSIONS = [
    "hot dog", "hotdog", "prairie dog", "polecat", "caterpillar",
    "catamaran", "tiger shark", "tiger beetle", "tiger snake", "tiger moth",
];

const CAT_INDICATORS = [
    "tabby", "tiger cat", "persian cat", "siamese", "egyptian cat",
    "lynx", "cougar", "puma", "snow leopard", "leopard", "jaguar",
    "lion", "tiger", "cheetah", "panther", "catamount", "mountain lion",
];

const DOG_INDICATORS = [
    "chihuahua", "spaniel", "maltese", "pekinese", "shih-tzu", "papillon",
    "terrier", "rhodesian", "afghan", "basset", "beagle", "bloodhound",
    "bluetick", "coonhound", "walker hound", "foxhound", "redbone",
    "borzoi", "wolfhound", "greyhound", "whippet", "ibizan", "elkhound",
    "otterhound", "saluki", "deerhound", "weimaraner", "staffordshire",
    "airedale", "cairn", "dandie dinmont", "boston bull", "schnauzer",
    "lhasa", "retriever", "pointer", "setter", "kuvasz", "schipperke",
    "groenendael", "malinois", "briard", "kelpie", "komondor", "sheepdog",
    "collie", "bouvier", "rottweiler", "german shepherd", "doberman",
    "pinscher", "mountain dog", "appenzeller", "entlebucher", "boxer",
    "mastiff", "bulldog", "great dane", "saint bernard", "eskimo dog",
    "malamute", "husky", "dalmatian", "affenpinscher", "basenji", "pug",
    "leonberg", "newfoundland", "great pyrenees", "samoyed", "pomeranian",
    "chow", "keeshond", "brabancon", "pembroke", "cardigan", "poodle",
    "mexican hairless", "dingo", "african hunting dog", "vizsla", "clumber",
    "sussex", "labrador", "chesapeake", "springer", "brittany",
];

function matchAnimal(className) {
    const lower = className.toLowerCase();
    for (const e of EXCLUSIONS) if (lower.includes(e)) return null;
    for (const c of CAT_INDICATORS) if (lower.includes(c)) return "cat";
    for (const d of DOG_INDICATORS) if (lower.includes(d)) return "dog";
    return null;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64 in request body" });

        const model = await loadModel();

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const tfImage = tf.node.decodeImage(imageBuffer, 3);

        const predictions = await model.classify(tfImage, 10);
        tfImage.dispose();

        let catScore = 0;
        let dogScore = 0;
        const catBreeds = [];
        const dogBreeds = [];
        const allPredictions = [];

        for (const pred of predictions) {
            const animal = matchAnimal(pred.className);
            allPredictions.push({
                name: pred.className,
                probability: pred.probability,
                type: animal,
            });
            if (animal === "cat") {
                catScore += pred.probability;
                catBreeds.push({ name: pred.className, prob: pred.probability });
            } else if (animal === "dog") {
                dogScore += pred.probability;
                dogBreeds.push({ name: pred.className, prob: pred.probability });
            }
        }

        const total = catScore + dogScore;
        let result = null;

        if (total < 0.05) {
            result = {
                label: "unknown",
                confidence: 0,
                catScore: 0,
                dogScore: 0,
                breeds: [],
                topPredictions: allPredictions,
            };
        } else {
            const nCat = catScore / total;
            const nDog = dogScore / total;
            const isCat = nCat > nDog;
            result = {
                label: isCat ? "cat" : "dog",
                confidence: isCat ? nCat : nDog,
                catScore: nCat,
                dogScore: nDog,
                breeds: isCat ? catBreeds : dogBreeds,
                topPredictions: allPredictions,
            };
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Classification error:", error);
        res.status(500).json({ error: error.message });
    }
}
