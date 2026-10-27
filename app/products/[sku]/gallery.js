"use client";

import { useState } from "react";

// Product photo with a thumbnail strip when there is more than one image.
export default function Gallery({ images, alt, dim }) {
  const [i, setI] = useState(0);
  if (!images?.length) return null;
  const many = images.length > 1;
  return (
    <div style={{width:"100%"}}>
      <div style={{display:"grid",placeItems:"center",minHeight:300}}>
        <img src={images[i]} alt={many ? `${alt} - photo ${i + 1} of ${images.length}` : alt} width="800" height="800"
          style={{maxWidth:"100%",maxHeight:460,height:"auto",objectFit:"contain",opacity:dim ? 0.55 : 1}} />
      </div>
      {many ? (
        <div role="list" aria-label="More photos" style={{display:"flex",gap:8,overflowX:"auto",marginTop:16,paddingBottom:4,scrollSnapType:"x mandatory"}}>
          {images.map((src, n) => (
            <button key={src} type="button" role="listitem" onClick={() => setI(n)} aria-label={`Show photo ${n + 1}`} aria-current={n === i ? "true" : undefined}
              style={{flex:"0 0 64px",height:64,padding:3,borderRadius:10,cursor:"pointer",background:"#fff",scrollSnapAlign:"start",
                border:n === i ? "2px solid #00a8e8" : "1px solid #e5e7eb"}}>
              <img src={src} alt="" loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain",display:"block"}} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
