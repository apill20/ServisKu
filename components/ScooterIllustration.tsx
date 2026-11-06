
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
        <Circle cx="78" cy="132" r="27" fill="#1E293B" />
        <Circle cx="78" cy="132" r="21" fill="#334155" />
        <Circle cx="78" cy="132" r="16" fill="#475569" />
        <Circle cx="78" cy="132" r="12" fill="#CBD5E1" />
        <Circle cx="78" cy="132" r="5" fill="#64748B" />
        <Path
          d="M78 116V148 M62 132H94 M67 121L89 143 M89 121L67 143"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
      </G>

      {/* Roda depan */}
      <G>
        <Circle cx="225" cy="132" r="27" fill="#1E293B" />
        <Circle cx="225" cy="132" r="21" fill="#334155" />
        <Circle cx="225" cy="132" r="16" fill="#475569" />
        <Circle cx="225" cy="132" r="12" fill="#CBD5E1" />
        <Circle cx="225" cy="132" r="5" fill="#64748B" />
        <Path
          d="M225 116V148 M209 132H241 M214 121L236 143 M236 121L214 143"
          stroke="#CBD5E1"
          strokeWidth="2"
        />
      </G>

      {/* Suspensi dan mesin belakang */}
      <Path
        d="M94 103L105 128L117 132"
        stroke="#475569"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Path
        d="M101 105L110 126"
        stroke="#94A3B8"
        strokeWidth="2"
      />

      {/* Mesin dan penutup CVT */}
      <Path
        d="M105 111
           Q123 106 144 112
           L151 130
           L116 136
           Q104 132 105 111Z"
        fill="#334155"
        stroke="#1E293B"
        strokeWidth="2"
      />
      <Path
        d="M115 117Q129 112 142 117L144 128L117 131Z"
        fill="#475569"
      />

      {/* Bodi bawah dan dek */}
      <Path
        d="M91 111
           Q111 107 130 111
           L181 115
           Q195 116 201 125
           L193 134
           L112 134
           Q94 131 91 111Z"
        fill="#A9C4B5"
        stroke="#294B45"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Bagian pijakan kaki */}
      <Path
        d="M142 111
           L190 115
           Q198 117 201 125
           L190 128
           L144 124Z"
        fill="#1E293B"
      />
      <Path
        d="M145 116L187 120"
        stroke="#64748B"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Bodi belakang */}
      <Path
        d="M68 91
           Q74 78 91 76
           L135 75
           Q150 76 160 91
           L153 113
           Q143 122 116 120
           L84 115
           Q69 109 68 91Z"
        fill="#A9C4B5"
        stroke="#294B45"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Panel samping belakang cream */}
      <Path
        d="M88 91
           Q111 83 137 88
           L150 101
           Q132 109 103 107
           L84 102Z"
        fill="#FFF7ED"
      />

      {/* Aksen panel samping */}
      <Path
        d="M103 95Q123 89 141 96"
        stroke="#8EAD9D"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M115 104L143 102"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Bodi depan */}
      <Path
        d="M165 62
           Q180 58 192 69
           Q204 81 212 103
           L219 119
           Q220 126 211 129
           L179 125
           Q164 123 160 111
           L158 84
           Q157 68 165 62Z"
        fill="#A9C4B5"
        stroke="#294B45"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Panel depan cream */}
      <Path
        d="M174 76
           Q187 70 195 85
           L207 113
           Q193 120 178 114
           Q169 103 174 76Z"
        fill="#FFF7ED"
      />

      {/* Panel hijau bagian atas */}
      <Path
        d="M164 69
           Q179 61 191 72
           L198 85
           L172 93
           Q162 87 164 69Z"
        fill="#86AA98"
      />

      {/* Lampu depan modern */}
      <Path
        d="M177 91
           Q191 82 202 94
           L207 105
           Q194 111 180 106
           Q174 101 177 91Z"
        fill="#E0F2FE"
        stroke="#475569"
        strokeWidth="1.5"
      />
      <Path
        d="M182 96Q192 91 201 98"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Spakbor depan */}
      <Path
        d="M199 112
           Q220 104 245 121
           Q239 109 224 105
           Q207 101 194 107Z"
        fill="#86AA98"
        stroke="#294B45"
        strokeWidth="1.5"
      />

      {/* Jok modern */}
      <Path
        d="M88 74
           Q94 62 112 59
           L145 59
           Q163 59 169 69
           Q172 75 163 80
           L105 83
           Q89 83 88 74Z"
        fill="#1E293B"
        stroke="#0F172A"
        strokeWidth="2"
      />
      <Path
        d="M100 70Q127 63 157 67"
        stroke="#64748B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M105 77Q131 74 159 75"
        stroke="#475569"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Stang */}
      <Path
        d="M174 64L170 47L185 39"
        stroke="#334155"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M170 47L190 47"
        stroke="#1E293B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Path
        d="M185 39L189 29"
        stroke="#334155"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Spion */}
      <Ellipse
        cx="190"
        cy="26"
        rx="8"
        ry="5"
        fill="#334155"
        stroke="#1E293B"
        strokeWidth="1.5"
      />
      <Path
        d="M188 24Q192 22 195 25"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Spion kedua */}
      <Path
        d="M168 48L160 35L151 31"
        stroke="#334155"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Ellipse
        cx="148"
        cy="29"
        rx="7"
        ry="5"
        fill="#334155"
        stroke="#1E293B"
        strokeWidth="1.5"
      />

      {/* Lampu belakang */}
      <Path
        d="M69 89L61 94L67 102L77 97Z"
        fill="#F87171"
        stroke="#991B1B"
        strokeWidth="1"
      />

      {/* Pegangan belakang */}
      <Path
        d="M78 78Q105 52 144 59"
        stroke="#64748B"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Suspensi depan */}
      <Path
        d="M207 111L218 131"
        stroke="#475569"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Knalpot */}
      <Path
        d="M121 128L154 130L158 136L126 136Z"
        fill="#334155"
      />
      <Path
        d="M129 131L151 132"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Standar samping */}
      <Path
        d="M163 130L158 154L151 154"
        stroke="#334155"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Detail bodi */}
      <Path
        d="M180 116L193 116"
        stroke="#86AA98"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}
