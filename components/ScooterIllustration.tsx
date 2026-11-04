
import React from 'react';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
} from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
};

export default function ScooterIllustration({
  width = 240,
  height = 150,
}: Props) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 300 180"
      fill="none"
    >
      {/* Awan kiri atas */}
      <Path
        d="M17 65
           C17 59 23 55 29 57
           C32 48 45 47 50 56
           C59 53 66 59 66 65
           C66 69 62 72 57 72
           L25 72
           C20 72 17 69 17 65Z"
        fill="#FFFFFF"
        opacity="0.85"
      />

      {/* Awan kanan atas */}
      <Path
        d="M226 51
           C226 45 232 41 238 43
           C241 34 254 33 259 42
           C268 39 275 45 275 51
           C275 55 271 58 266 58
           L234 58
           C230 58 226 55 226 51Z"
        fill="#FFFFFF"
        opacity="0.8"
      />

      {/* Awan kecil kiri bawah */}
      <Path
        d="M15 117
           C15 112 20 109 25 111
           C29 103 40 103 44 111
           C51 109 57 113 57 118
           C57 121 54 123 50 123
           L23 123
           C18 123 15 121 15 117Z"
        fill="#FFFFFF"
        opacity="0.7"
      />

      {/* Aksen garis perjalanan kiri */}
      <Path
        d="M8 87H34"
        stroke="#7DD3D8"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.65"
      />
      <Path
        d="M19 96H37"
        stroke="#7DD3D8"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Aksen garis perjalanan kanan */}
      <Path
        d="M263 91H287"
        stroke="#7DD3D8"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.65"
      />
      <Path
        d="M269 101H282"
        stroke="#7DD3D8"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Bayangan */}
      <Ellipse
        cx="148"
        cy="158"
        rx="112"
        ry="7"
        fill="#0f172a"
        opacity="0.08"
      />

      {/* Roda belakang */}
      <G>
        <Circle cx="78" cy="132" r="27" fill="#172554" />
        <Circle cx="78" cy="132" r="19" fill="#334155" />
        <Circle cx="78" cy="132" r="13" fill="#e2e8f0" />
        <Circle cx="78" cy="132" r="6" fill="#0f766e" />
        <Path
          d="M78 113V151 M59 132H97 M65 119L91 145 M91 119L65 145"
          stroke="#94a3b8"
          strokeWidth="2"
        />
      </G>

      {/* Roda depan */}
      <G>
        <Circle cx="225" cy="132" r="27" fill="#172554" />
        <Circle cx="225" cy="132" r="19" fill="#334155" />
        <Circle cx="225" cy="132" r="13" fill="#e2e8f0" />
        <Circle cx="225" cy="132" r="6" fill="#0f766e" />
        <Path
          d="M225 113V151 M206 132H244 M212 119L238 145 M238 119L212 145"
          stroke="#94a3b8"
          strokeWidth="2"
        />
      </G>

      {/* Bodi bawah dan dek */}
      <Path
        d="M94 115
           C112 108 135 107 158 111
           L197 116
           C205 117 211 124 207 130
           L116 130
           C101 130 91 125 94 115Z"
        fill="#0f766e"
      />

      {/* Bodi belakang */}
      <Path
        d="M72 99
           C77 86 91 78 112 78
           L148 79
           C164 81 174 91 174 107
           L159 119
           L108 119
           C91 118 75 112 72 99Z"
        fill="#0d9488"
      />

      {/* Panel samping sporty */}
      <Path
        d="M91 91
           L137 88
           L155 103
           L112 110
           L91 101Z"
        fill="#14b8a6"
      />
      <Path
        d="M105 99L139 95L148 102L113 106Z"
        fill="#ccfbf1"
        opacity="0.8"
      />

      {/* Bodi depan */}
      <Path
        d="M171 62
           C184 62 197 73 203 89
           L216 115
           C219 121 214 127 207 127
           L177 124
           C168 122 163 116 165 106
           L164 79
           C164 70 166 64 171 62Z"
        fill="#0f766e"
      />

      {/* Panel depan */}
      <Path
        d="M178 76
           C190 76 199 91 203 108
           L179 109
           C172 103 171 87 178 76Z"
        fill="#14b8a6"
      />

      {/* Lampu LED */}
      <Path
        d="M177 73
           Q190 69 197 82
           L190 89
           Q180 87 175 82Z"
        fill="#fef3c7"
      />
      <Path
        d="M180 77Q189 74 193 82"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Spakbor depan */}
      <Path
        d="M195 110
           Q221 105 244 121
           Q239 110 225 106
           Q207 99 192 104Z"
        fill="#115e59"
      />

      {/* Jok modern */}
      <Path
        d="M91 75
           C99 64 117 59 140 60
           L158 61
           C166 62 170 68 166 74
           L153 79
           L101 81
           Q88 81 91 75Z"
        fill="#172554"
      />
      <Path
        d="M101 68Q127 62 157 67"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Stang dan spion */}
      <Path
        d="M175 64L170 44L181 37"
        stroke="#334155"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M168 43L190 43"
        stroke="#334155"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Path
        d="M181 37L185 27"
        stroke="#334155"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Ellipse cx="186" cy="25" rx="7" ry="4" fill="#172554" />

      {/* Aksen bodi */}
      <Path
        d="M177 96L190 96"
        stroke="#ccfbf1"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Lampu belakang */}
      <Path
        d="M74 91L66 96L72 103L82 98Z"
        fill="#fb7185"
      />

      {/* Garis detail */}
      <Path
        d="M117 115L151 115"
        stroke="#99f6e4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
