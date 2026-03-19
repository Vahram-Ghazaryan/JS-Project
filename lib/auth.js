import app from "./firebase";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
} from "firebase/auth";

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export default auth;
