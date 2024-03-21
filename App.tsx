import { StatusBar } from 'expo-status-bar';
import { Button, Pressable, StyleSheet, Text, View, } from 'react-native';
import React, { useEffect, useState } from "react";
import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { TouchableOpacity, Linking } from 'react-native';

Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: false,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});

export default function App() {
  const { state, startRecognizing, stopRecognizing, destroyRecognizer } =
    useVoiceRecognition();
  const [borderColor, setBorderColor] = useState<"lightgray" | "lightgreen">(
    "lightgray"
  );
  const [urlPath, setUrlPath] = useState("");

  useEffect(() => {
    listFiles();
  }, []);

  const listFiles = async () => {
    try {
      const result = await FileSystem.readDirectoryAsync(
        FileSystem.documentDirectory!
      );
      if (result.length > 0) {
        const filename = result[0];
        const path = FileSystem.documentDirectory + filename;
        console.log("Full path to the file:", path);
        setUrlPath(path);
      }
    } catch (error) {
      console.error("Error listando los archivos:", error);
    }
  };

  const handleSubmit = async () => {
    if (!state.results[0]) return;
    try {
      // Fetch the audio blob from the server
      const audioBlob = await fetchAudio(state.results[0]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === "string") {
          // data:audio/mpeg;base64,....(actual base64 data)...
          const audioData = e.target.result.split(",")[1];

          // Write the audio data to a local file
          // save data
          const path = await writeAudioToFile(audioData);

          //Plat audio
          // setUrlPath(path);
          await playFromPath(path);
          destroyRecognizer();
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e) {
      console.error("Error:", e);
    }
  };




  // Function to fetch synthesized audio from the server
  const fetchAudio = async (text: string) => {
    const response = await fetch(
      "http://localhost:3000/text-to-speech/synthesize",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }
    );
    return await response.blob();
  };

  // Function to write the audio data to a local file
  const writeAudioToFile = async (audioData: string) => {
    const path = FileSystem.documentDirectory + "temp.mp3";
    await FileSystem.writeAsStringAsync(path, audioData, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return path;
  };

  async function playFromPath(path: string) {
    try {
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: path });
      await soundObject.playAsync();
    } catch (error) {
      console.log("Ocurrio un error reproduciendo el audio:", error);
    }
  }

  const abrirEnlace = () => {
    const webUrl = 'https://alexmancilla.github.io/landing-page-miabogado/'; // Reemplaza esto con tu URL
    Linking.openURL(webUrl);
  };

  return (
    <View style={styles.container}>

      <Text style={{ fontSize: 42, fontWeight: "bold", marginBottom: 5 }}>
      mIAbogado
      </Text>
      <Text style={styles.instructions1}>
      Tu asistente legal.
      </Text>
      {/* <Text style={styles.instructions}>
       Mantén pulsado el botón para grabar tu voz. Suelte el botón para
      enviar la grabación, y oirás una respuesta
      </Text> */}

      
      <Text style={styles.welcome}>Cuentame tu asunto:</Text>

      <Pressable
      onPressIn={() => {
        setBorderColor("lightgreen");
        startRecognizing();
      }}
      onPressOut={() => {
        setBorderColor("lightgray");
        stopRecognizing();
        handleSubmit();
      }}
      style={{
        width: "90%",
        padding: 30,
        gap: 10,
        borderWidth: 3,
        alignItems: "center",
        borderRadius: 10,
        borderColor: borderColor,
      }}>
      
        
        <Text style={styles.welcome2}>
          {state.isRecording ? "Suelta para enviar" : "Presiona"}
        </Text>
      </Pressable>

      <Button
        title="Reproduce respuesta de nuevo"
        onPress={async () => await playFromPath(urlPath)}
      />

      <Text style={styles.welcomeFinal}>Visita para ayuda personalizada:</Text>
      <TouchableOpacity onPress={abrirEnlace}>
        <Text style={{fontSize: 20, color: 'blue', marginTop: 10, textDecorationLine: 'underline', marginBottom: 5 }}>
          miabogado.com
        </Text>
      </TouchableOpacity>

      {/* <Text style={styles.welcome}>{JSON.stringify(state, null, 2)}</Text> */}
      {/* <StatusBar style="auto" /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    padding: 20,
  },
  welcome: {
    fontSize: 30,
    textAlign: "center",
    margin: 10,
    marginTop: 2,
  },
  welcome2: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
    marginBottom: 25,
  },
  welcomeFinal: {
    marginTop: 70,
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  action: {
    textAlign: "center",
    color: "#0000FF",
    marginVertical: 5,
    fontWeight: "bold",
  },
  instructions1: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 60,
    fontSize: 18,
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 60,
    fontSize: 12,
  },
  stat: {
    textAlign: "center",
    color: "#B0171F",
    marginBottom: 1,
  },
});
