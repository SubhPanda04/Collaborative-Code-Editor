import { signInWithRedirect, GoogleAuthProvider} from "firebase/auth"
import { auth } from "../config/firebase.config"


const googleProvider = new GoogleAuthProvider()

export const signINWithGoogle = async () => {
    await signInWithRedirect(auth, googleProvider).then(userCred => {
        window.location.reload();
    })
}