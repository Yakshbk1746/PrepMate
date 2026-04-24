import {auth} from "../config/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase";

const loginUserWithEmail = async(email,password)=>{
    const userCredential = await signInWithEmailAndPassword(auth,email,password);
    const user = userCredential.user;

    const token = user.getIdToken();

    
}