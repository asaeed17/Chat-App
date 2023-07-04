import './App.css';
import {useRef} from 'react';

//firebase SDK
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

//hooks
import {useAuthState} from 'react-firebase-hooks/auth';
import {useCollectionData} from 'react-firebase-hooks/firestore';
import {useState} from 'react';

firebase.initializeApp({
  //cloud firestore details
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  //assigns the value of the first element of the array returned by useAuthState(auth) to the variable user
  //user is an object when signed in else it is null
  const [user] = useAuthState(auth) //same as const user = useAuthState(auth)[0]

  return (
    <div className="App">
      <header>
        <h1>Chat App 💬</h1>
        <SignOut/>
      </header>

      <section>
        {/* if user is not null, show chat room */}
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

const SignIn = () => {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);  //google sign on popup

  }

  return (
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  )
}

const SignOut = () => {
  return auth.currentUser && (  //if current user signed in and sign out clicked

    <button onClick={() => auth.signOut()}>Sign Out</button>
  );
}

const ChatRoom = () => {
  //reference a firestore collection
  const dummy = useRef(); //react hook to reference to current html element 
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt')//.limit(25); //query documents in a collection

  //listen to data with the useCollectionData hook
  const [messages] = useCollectionData(query, {idField: 'id'}); //returns an array of objects where each object is the message in the database 
  //react will re-render with the latest data anytime the data changes

  const [formValue, setFormValue] = useState('');

  const sendMessage = async(e) => {
    e.preventDefault(); //prevents default page refresh after form submission

    const {uid, photoURL} = auth.currentUser;

    //create new document in firestore
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL  //field names are the same as that of firebase
    });

    setFormValue(''); //reset form value back to empty string

    dummy.current.scrollIntoView({ behaviour : 'smooth' })
  }

  return (
    <>
      <main>  
        {/* 
            - loop over each document
            - dedicated ChatMessage component with key prop with the message id and passes the document data as the message prompt */
        messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      
        <div ref={dummy}></div>

      </main>

      <form onSubmit={sendMessage}>

        {/* change event triggered when user types into the form.
            Value of change will be set to the form value state */}
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)}/>

        <button type="submit">✔️</button>
      </form>
    </>
  )
}

const ChatMessage = (props) => {
  const {text, uid, photoURL} = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}> 
      <img src={photoURL} />
      <p>{text}</p>
    </div>
  )
}

export default App;