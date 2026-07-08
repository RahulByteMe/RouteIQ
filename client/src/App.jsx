import { Routes,Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Driver from "./pages/Driver";
import Dispatcher from "./pages/Dispatcher";
import NotFound from "./pages/NotFound";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import MapDemo from "./pages/MapDemo";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
      
      <Route path="/" element={<Home />} />
      <Route path="/driver" element={ <ProtectedRoute> <Driver /> </ProtectedRoute> } />
      <Route path="/dispatcher" element={  <ProtectedRoute> <Dispatcher /> </ProtectedRoute> } />
      <Route path="/map" element={<MapDemo />} />
       </Route>
       
    
     
      <Route element={<AuthLayout />}>
       <Route path="/login" element={<Login />} />
      
      </Route>
      <Route path="*" element={<NotFound />} /> 
     
    </Routes>
  );
}

export default App;