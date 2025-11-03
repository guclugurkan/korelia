import OrdersPanel from "../components/OrdersPanel";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";

export default function OrdersPage(){
  return (
    <main className="account-wrap">
      <SiteHeader/>
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
