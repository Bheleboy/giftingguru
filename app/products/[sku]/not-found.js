export default function ProductNotFound() {
  return (
    <main style={{maxWidth:640,margin:"80px auto",padding:"0 20px",textAlign:"center"}}>
      <a href="/"><img src="/giftingguru-logo.png" alt="GiftingGuru" style={{width:200,height:"auto"}} /></a>
      <h1 style={{fontSize:32,margin:"32px 0 12px"}}>We couldn&apos;t find that product</h1>
      <p style={{fontSize:17,lineHeight:1.6,color:"#4b5563"}}>The link may be old or the product may have been removed from our range. Our full catalogue is just a click away.</p>
      <a href="/#shop" style={{display:"inline-block",marginTop:20,padding:"14px 24px",borderRadius:9,background:"#111827",color:"#fff",fontWeight:800,textDecoration:"none"}}>Browse all products</a>
    </main>
  );
}
