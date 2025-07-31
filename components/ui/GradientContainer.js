import React from "react"
import { StyleSheet, View } from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context" 

const GradientContainer = ({ children, colors, style }) => {
  const insets = useSafeAreaInsets() 
  const gradientColors = colors || ["#1a1a40", "#0f0f2e", "#1a1a40"]

  return (
    <LinearGradient colors={gradientColors} style={[StyleSheet.absoluteFillObject, style]}>
     
      <View
        style={[
          styles.contentWithInsets,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  
  contentWithInsets: {
    flex: 1, 
  },
})

export default React.memo(GradientContainer)