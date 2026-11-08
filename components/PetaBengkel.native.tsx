// components/PetaBengkel.native.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import {
  buatHtmlPeta,
  BengkelPeta,
} from "./petaBengkelHtml";

interface Props {
  latitude: number;
  longitude: number;
  bengkel: BengkelPeta[];
}

export default function PetaBengkel({
  latitude,
  longitude,
  bengkel,
}: Props) {
  const html = buatHtmlPeta(latitude, longitude, bengkel);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 280,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
