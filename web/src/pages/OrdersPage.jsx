import OrdersPanel from "../components/OrdersPanel";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";

export default function OrdersPage(){
  return (
    <main className="account-wrap">
      <HeaderAll/>
      <div className="account-container">
        <div className="card-head" style={{marginBottom:12}}>
          <h1 className="card-title" style={{margin:0}}>Toutes mes commandes</h1>
        </div>
        <OrdersPanel limit={Infinity} showAllButton={false}/>
      </div>
      <Footer/>
    </main>
  );
}
