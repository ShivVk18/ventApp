import { useEffect, useState, useRef } from "react";
import { Text, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import GradientContainer from "../../components/ui/GradientContainer";
import StatusBar from "../../components/ui/StatusBar";
import SessionTimer from "../../components/session/SessionTimer";
import ConnectionStatus from "../../components/session/ConnectionStatus";
import VoiceControls from "../../components/session/VoiceControls";
import useTimer from "../../hooks/useTimer";
import { firestore } from "../config/firebase.config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from "react-native-agora";

const AGORA_APP_ID = "f16b94ea49fd47b5b65e86d20ef1badd";

export default function VoiceCallScreen() {
  
  const navigation = useNavigation();
  const route = useRoute();
  
  const { ventText, plan, channelName, isHost } = route.params;

  const [isJoined, setIsJoined] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [remoteUserIds, setRemoteUserIds] = useState([])
  const engine = useRef(null)
  const [localUid, setLocalUid] = useState(0)

  const getDurationInSeconds = (planName) => {
    switch (planName) {
      case "10-Min Vent":
        return 10 * 60
      case "30-Min Vent":
        return 30 * 60
      default:
        return 20 * 60
    }
  }

  const initialCallDuration = getDurationInSeconds(plan)

  const handleTimeUp = () => {
    Alert.alert("Session Ended", "Your session has ended automatically.", [
      {
        text: "OK",
        onPress: async () => {
          await destroyAgora()
          await updateRoomStatusInFirebase("ended")
          navigation.replace("Dashboard");
        },
      },
    ])
  }

  const { sessionTime, timeRemaining, stopTimer } = useTimer(initialCallDuration, handleTimeUp)

  const initAgora = async () => {

    try {
      if (!AGORA_APP_ID || AGORA_APP_ID === "f16b94ea49fd47b5b65e86d20ef1badd") {
        Alert.alert(
          "Agora App ID Missing",
        )
        navigation.replace("Dashboard");
        return
      }

      engine.current = createAgoraRtcEngine()
      await engine.current.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      })

      await engine.current.setChannelProfile(ChannelProfileType.ChannelProfileCommunication)
      await engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster)
      await engine.current.enableAudio()
      await engine.current.setEnableSpeakerphone(true)
      setIsSpeakerEnabled(true)

      engine.current.registerEventHandler({

        //events 
        onJoinChannelSuccess : (connection, elapsed) => {
          setIsJoined(true)
          setLocalUid(connection.localUid || 0)
          engine.current?.muteLocalAudioStream(false)
          setIsMuted(false)
        },
        
        onUserJoined: (connection, remoteUid, elapsed) => {
          setRemoteUserIds((prev) => {
            if (!prev.includes(remoteUid)) return [...prev, remoteUid]
            return prev
          })
        },

        onUserOffline: (connection, remoteUid, reason) => {
          setRemoteUserIds((prev) => prev.filter((id) => id !== remoteUid))
        },

        onError: (err, msg) => {
          console.error("Agora Error:", err, msg)
          Alert.alert("Agora Error", `Code: ${err}, Message: ${msg}`)
        },

        onLeaveChannel: (connection, stats) => {
          setIsJoined(false)
          setRemoteUserIds([])
          setLocalUid(0)
          stopTimer()
        },

        onConnectionStateChanged: (connection, state, reason) => {
          console.log("Agora: Connection State Changed", state, reason)
        },

      })

      if (!channelName) {
        Alert.alert("Room Error", "No channel name provided.")
         navigation.replace("Dashboard");
        return
      }

      const uid = Math.floor(Math.random() * 1000000)

      await engine.current.joinChannel("", channelName, uid, {
        autoSubscribeAudio: true,
        autoSubscribeVideo: false,
        publishMicrophoneTrack: true,
        publishCameraTrack: false,
      })

      console.log("Agora: Joined channel", channelName, "with UID", uid)

    } catch (e) {
      console.error("Agora Init Error:", e)
      Alert.alert("Call Setup Failed", e.message || e.toString())
      navigation.replace("Dashboard");
    }
  }

  const destroyAgora = async () => {
    if (engine.current) {
      try {
        await engine.current.leaveChannel()
        engine.current.release()
        engine.current = null
      } catch (error) {
        console.error("Agora Cleanup Error:", error)
      }
    }
  }

  const updateRoomStatusInFirebase = async (status) => {
    if (channelName) {
      try {
        const roomRef = doc(firestore, "rooms", channelName)
        await updateDoc(roomRef, {
          status,
          endTime: serverTimestamp(),
        })
      } catch (error) {
        console.error("Firebase Update Error:", error)
      }
    }
  }

  useEffect(() => {
    initAgora()
    return () => {
      stopTimer()
      destroyAgora()
      if (isJoined) updateRoomStatusInFirebase("ended")
    }
  }, [])

  const toggleMute = async () => {
    if (engine.current && isJoined) {
      try {
        const newMutedState = !isMuted
        await engine.current.muteLocalAudioStream(newMutedState)
        setIsMuted(newMutedState)
      } catch (error) {
        Alert.alert("Error", "Failed to toggle microphone")
      }
    }
  }

  const toggleSpeaker = async () => {
    if (engine.current && isJoined) {
      try {
        const newSpeakerState = !isSpeakerEnabled
        await engine.current.setEnableSpeakerphone(newSpeakerState)
        setIsSpeakerEnabled(newSpeakerState)
      } catch (error) {
        Alert.alert("Error", "Failed to toggle speaker")
      }
    }
  }

  const handleEndCall = async () => {
    Alert.alert("End Session", "Are you sure you want to end this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        onPress: async () => {
          stopTimer()
          await destroyAgora()
          await updateRoomStatusInFirebase("ended")
          navigation.replace("Dashboard");
        },
      },
    ])
  }

  return (
    <GradientContainer>
      <StatusBar />
      <SessionTimer sessionTime={sessionTime} timeRemaining={timeRemaining} plan={plan} />
      <Text style={styles.ventTextDisplay}>{ventText}</Text>
      <ConnectionStatus joined={isJoined} remoteUsers={remoteUserIds} timeRemaining={timeRemaining} />
      <VoiceControls
        muted={isMuted}
        speakerEnabled={isSpeakerEnabled}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onEndCall={handleEndCall}
        disabled={!isJoined}
      />
    </GradientContainer>
  )
}

const styles = StyleSheet.create({
  ventTextDisplay: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
})
