import tf from '@tensorflow/tfjs-node';
import { doc, getDoc } from 'firebase/firestore';
import util from 'util';
if (typeof util.isNullOrUndefined !== 'function') {
    util.isNullOrUndefined = function (d) {
        return d === null || d === undefined;
    };
}
import db from '../../../../lib/firestore';

const MODEL_INPUT_SIZE = 28;

let cachedModel = null;

const loadModelFromFirestore = async () => {
    if (cachedModel) return cachedModel;

    console.log("Loading model metadata from Firestore...");
    const docRef = await getDoc(doc(db, 'models', 'digit-recognizer'));
    if (!docRef.exists()) throw new Error("Model not found in Firestore. Please train it first.");
    const metadata = docRef.data();

    console.log(`Loading ${metadata.numChunks} weight chunks...`);
    const chunks = [];
    for (let i = 0; i < metadata.numChunks; i++) {
        const chunkDoc = await getDoc(doc(db, 'models', `digit-recognizer-chunk-${i}`));
        if (!chunkDoc.exists()) throw new Error(`Missing chunk ${i}`);
        chunks.push(chunkDoc.data().data);
    }

    const weightsBuffer = Buffer.concat(chunks.map(c => Buffer.from(c, 'base64')));

    const ioHandler = {
        load: async () => {
            return {
                modelTopology: metadata.modelJson.modelTopology,
                weightSpecs: metadata.modelJson.weightsManifest[0].weights,
                weightData: weightsBuffer.buffer.slice(weightsBuffer.byteOffset, weightsBuffer.byteOffset + weightsBuffer.byteLength)
            };
        }
    };

    console.log("Parsing model...");
    const model = await tf.loadLayersModel(ioHandler);
    cachedModel = model;
    return model;
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { pixelArray } = req.body;
        if (!pixelArray || pixelArray.length !== MODEL_INPUT_SIZE * MODEL_INPUT_SIZE) {
            return res.status(400).json({ error: 'Missing or invalid pixelArray' });
        }

        const model = await loadModelFromFirestore();

        console.log("Running prediction...");
        const prediction = tf.tidy(() => {
            const inputTensor = tf.tensor4d(pixelArray, [1, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 1]);
            return model.predict(inputTensor);
        });

        const probabilities = await prediction.data();

        prediction.dispose();

        const probs = Array.from(probabilities);
        const predictionIndex = probs.indexOf(Math.max(...probs));

        res.status(200).json({
            prediction: predictionIndex,
            confidences: probs
        });
    } catch (error) {
        console.error("Prediction error:", error);
        res.status(500).json({ error: error.message });
    }
}
