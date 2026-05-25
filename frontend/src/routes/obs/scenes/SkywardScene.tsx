/**
 * Skyward Sword scene — Skyloft floating in a sea of clouds, sun rays
 * pouring through, a Loftwing gliding past, the Goddess Statue silhouetted
 * in the haze, and ancient sky-cypher symbols slowly drifting upward.
 */
export function SkywardScene() {
  return (
    <div className="ss-scene" aria-hidden="true">
      {/* Sun rays radiating from above */}
      <div className="ss-sunrays" />

      {/* The Goddess Statue silhouette — set far back. */}
      <svg className="ss-goddess" viewBox="0 0 200 360">
        <path
          d="M100 350 L70 350 L70 320 L60 320 L60 280 L70 270 L72 220 L65 200 L60 180 L65 155 L78 130 L75 105 L82 85 L80 70 L88 55 L92 35 L100 22 L108 35 L112 55 L120 70 L118 85 L125 105 L122 130 L135 155 L140 180 L135 200 L128 220 L130 270 L140 280 L140 320 L130 320 L130 350 Z"
          fill="rgba(20, 35, 60, 0.92)"
        />
        {/* arms outstretched */}
        <path
          d="M75 105 L40 130 L42 138 L78 118 Z"
          fill="rgba(20, 35, 60, 0.92)"
        />
        <path
          d="M125 105 L160 130 L158 138 L122 118 Z"
          fill="rgba(20, 35, 60, 0.92)"
        />
        {/* Sword extended */}
        <line
          x1="100" y1="22" x2="100" y2="-15"
          stroke="rgba(255, 230, 130, 0.55)"
          strokeWidth="2"
        />
        <line
          x1="92" y1="-2" x2="108" y2="-2"
          stroke="rgba(255, 230, 130, 0.55)"
          strokeWidth="2"
        />
      </svg>

      {/* Sea of clouds — three parallax bands */}
      <div className="ss-clouds ss-clouds-far" />
      <div className="ss-clouds ss-clouds-mid" />
      <div className="ss-clouds ss-clouds-near" />

      {/* Smaller broken sky islands */}
      <svg className="ss-island ss-island-left" viewBox="0 0 220 120">
        <path
          d="M10 70 Q60 30 130 40 Q190 50 210 70 L185 95 Q130 105 80 95 Q40 92 10 80 Z"
          fill="rgba(56, 96, 130, 0.93)"
        />
        <path d="M40 95 L20 130 L60 100 Z" fill="rgba(40, 70, 100, 0.95)" />
        {/* tree tuft */}
        <path d="M120 40 L115 25 L120 28 L130 18 L135 32 L130 40 Z" fill="rgba(20, 60, 40, 0.95)" />
      </svg>
      <svg className="ss-island ss-island-right" viewBox="0 0 220 120">
        <path
          d="M10 70 Q60 35 140 45 Q200 55 210 70 L190 90 Q140 100 100 95 Q50 95 10 82 Z"
          fill="rgba(48, 84, 116, 0.93)"
        />
        <path d="M160 90 L180 130 L140 95 Z" fill="rgba(36, 64, 92, 0.95)" />
        <path d="M70 45 L68 30 L74 30 L82 22 L85 36 L80 45 Z" fill="rgba(20, 60, 40, 0.95)" />
      </svg>

      {/* Skyloft itself — bigger, centred, with the iconic tower. */}
      <svg className="ss-skyloft" viewBox="0 0 620 220">
        {/* main island body */}
        <path
          d="M40 130 Q140 60 260 70 Q400 80 520 95 Q585 105 600 145 L545 175 Q400 185 260 178 Q140 173 70 165 Z"
          fill="rgba(60, 100, 140, 0.95)"
          stroke="rgba(30, 60, 90, 0.95)"
          strokeWidth="1.5"
        />
        {/* roofs and houses */}
        <path d="M180 95 L195 75 L210 95 L210 115 L180 115 Z" fill="#c66533" />
        <path d="M180 75 L195 60 L210 75 L195 75 Z" fill="#7a3a18" />
        <path d="M230 85 L242 65 L254 85 L254 115 L230 115 Z" fill="#c66533" />
        {/* the central goddess tower */}
        <path d="M295 80 L295 22 L335 12 L375 22 L375 80 Z" fill="rgba(45, 80, 120, 0.96)" />
        <path d="M315 22 L335 -6 L355 22 Z" fill="#ffd84a" />
        <circle cx="335" cy="40" r="6" fill="#9bd6ff" />
        {/* more houses on the right side */}
        <path d="M410 88 L425 68 L440 88 L440 115 L410 115 Z" fill="#c66533" />
        <path d="M455 92 L470 72 L485 92 L485 115 L455 115 Z" fill="#c66533" />
        {/* hanging rocks under */}
        <path d="M120 175 L90 220 L160 180 Z" fill="rgba(40, 70, 100, 0.95)" />
        <path d="M420 175 L390 220 L450 180 Z" fill="rgba(40, 70, 100, 0.95)" />
        <path d="M270 178 L250 215 L300 182 Z" fill="rgba(40, 70, 100, 0.95)" />
      </svg>

      {/* The Loftwing gliding across */}
      <svg className="ss-loftwing" viewBox="0 0 240 90">
        <g>
          {/* body */}
          <path
            d="M40 50 Q70 35 110 38 Q150 30 180 42 Q205 50 215 55 Q180 60 140 58 Q90 65 50 55 Q35 53 40 50 Z"
            fill="rgba(232, 70, 80, 1)"
            stroke="rgba(150, 30, 30, 0.8)"
            strokeWidth="1.5"
          />
          {/* head */}
          <circle cx="200" cy="48" r="10" fill="rgba(232, 70, 80, 1)" stroke="rgba(150, 30, 30, 0.8)" strokeWidth="1.5" />
          {/* beak */}
          <path d="M210 46 L222 49 L210 52 Z" fill="#ffaa3a" />
          {/* eye */}
          <circle cx="203" cy="46" r="2" fill="#fff" />
          {/* tail feathers */}
          <path d="M40 50 L15 40 L30 55 L10 60 L30 60 Z" fill="rgba(232, 70, 80, 1)" />
          {/* wings (animated up/down) */}
          <g className="ss-loftwing-wing">
            <path
              d="M90 40 Q110 5 150 15 Q175 18 165 38 Q130 35 100 45 Z"
              fill="rgba(232, 70, 80, 0.98)"
              stroke="rgba(150, 30, 30, 0.8)"
              strokeWidth="1.5"
            />
          </g>
        </g>
      </svg>

      {/* Ancient Skyward Sword cypher symbols floating upward */}
      <div className="ss-cyphers" />

      {/* Soft cloud overlay near the foreground */}
      <div className="ss-foreground-mist" />
    </div>
  );
}
