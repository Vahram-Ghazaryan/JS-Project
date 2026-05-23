import tf from '@tensorflow/tfjs-node';
import { doc, setDoc } from 'firebase/firestore';
import db from '../../../../lib/firestore';
import fs from 'fs';
import path from 'path';
import util from 'util';
import zlib from 'zlib';

if (typeof util.isNullOrUndefined !== 'function') {
    util.isNullOrUndefined = function (d) {
        return d === null || d === undefined;
    };
}

const MODEL_INPUT_SIZE = 28;
const MNIST_NUM_CLASSES = 10;
const MNIST_IMAGE_SIZE = 784;

const TRAIN_IMAGES_URL = "https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png";
const TRAIN_LABELS_URL = "https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        console.log("Downloading MNIST data...");
        const [imgResponse, labelResponse] = await Promise.all([
            fetch(TRAIN_IMAGES_URL),
            fetch(TRAIN_LABELS_URL),
        ]);

        const imgBuffer = await imgResponse.arrayBuffer();
        const labelBuffer = await labelResponse.arrayBuffer();

        const trainSize = 65000;

        console.log("Decoding PNG using UPNG...");
        const upngRes = await fetch('https://unpkg.com/upng-js@2.1.0/UPNG.js');
        const upngCode = await upngRes.text();
        const upngModule = { exports: {} };
        const fakeWindow = {
            pako: {
                inflate: (data) => new Uint8Array(zlib.inflateSync(Buffer.from(data)))
            }
        };
        new Function('window', 'module', 'exports', upngCode)(fakeWindow, upngModule, upngModule.exports);
        const UPNG = upngModule.exports;

        const img = UPNG.decode(imgBuffer);
        const rgba8 = new Uint8Array(UPNG.toRGBA8(img)[0]);

        const xsBuffer = new Float32Array(trainSize * MNIST_IMAGE_SIZE);
        const ysBuffer = new Float32Array(trainSize * MNIST_NUM_CLASSES);

        const labelData = new Uint8Array(labelBuffer);

        for (let i = 0; i < trainSize; i++) {
            for (let j = 0; j < MNIST_IMAGE_SIZE; j++) {
                xsBuffer[i * MNIST_IMAGE_SIZE + j] = rgba8[(i * 784 + j) * 4] / 255.0;
            }
            const labelArr = labelData.slice(i * MNIST_NUM_CLASSES, i * MNIST_NUM_CLASSES + MNIST_NUM_CLASSES);
            for (let k = 0; k < MNIST_NUM_CLASSES; k++) {
                ysBuffer[i * MNIST_NUM_CLASSES + k] = labelArr[k];
            }
        }

        const xs = tf.tensor4d(xsBuffer, [trainSize, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 1]);
        const ys = tf.tensor2d(ysBuffer, [trainSize, MNIST_NUM_CLASSES]);

        console.log("Building model...");
        const model = tf.sequential();
        model.add(tf.layers.conv2d({
            inputShape: [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 1],
            filters: 32,
            kernelSize: 3,
            activation: "relu",
            padding: "same",
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: "relu", padding: "same" }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        model.add(tf.layers.flatten());
        model.add(tf.layers.dense({ units: 128, activation: "relu" }));
        model.add(tf.layers.dropout({ rate: 0.3 }));
        model.add(tf.layers.dense({ units: MNIST_NUM_CLASSES, activation: "softmax" }));

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: "categoricalCrossentropy",
            metrics: ["accuracy"],
        });

        console.log("Training model...");
        await model.fit(xs, ys, {
            epochs: 5,
            batchSize: 128,
            validationSplit: 0.1,
            shuffle: true,
        });

        tf.dispose([xs, ys]);

        console.log("Saving model to local dir...");
        const tempDir = path.join(process.cwd(), '.temp-model');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        await model.save(`file://${tempDir}`);

        console.log("Uploading model to Firestore...");
        const modelJsonPath = path.join(tempDir, 'model.json');
        const weightsPath = path.join(tempDir, 'weights.bin');

        const modelJson = fs.readFileSync(modelJsonPath, 'utf8');
        const weightsBufferFile = fs.readFileSync(weightsPath);

        const CHUNK_SIZE = 500 * 1024;
        const chunks = [];
        for (let i = 0; i < weightsBufferFile.length; i += CHUNK_SIZE) {
            chunks.push(weightsBufferFile.slice(i, i + CHUNK_SIZE).toString('base64'));
        }

        for (let i = 0; i < chunks.length; i++) {
            await setDoc(doc(db, 'models', `digit-recognizer-chunk-${i}`), {
                data: chunks[i],
                index: i
            });
        }

        await setDoc(doc(db, 'models', 'digit-recognizer'), {
            modelJson: JSON.parse(modelJson),
            numChunks: chunks.length,
            updatedAt: new Date().toISOString()
        });

        fs.unlinkSync(modelJsonPath);
        fs.unlinkSync(weightsPath);

        res.status(200).json({ success: true, message: 'Model trained and saved to Firestore!' });
    } catch (error) {
        console.error("Training error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}
