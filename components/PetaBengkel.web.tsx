// components/PetaBengkel.web.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
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
      {React.createElement("iframe" as any, {
        srcDoc: html,
        title: "Peta Bengkel ServisKu",
        frameBorder: "0",
        style: {
          width: "100%",
          height: "100%",
          border: "none",
        } as any,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 280,
    overflow: "hidden",
  },
});
