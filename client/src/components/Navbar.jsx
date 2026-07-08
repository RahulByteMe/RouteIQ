import { Link } from "react-router-dom";


function Navbar() {
    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white font-bold text-xl">RouteIQ</div>
                <div>
                    <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium" >
                        Home
                    </Link>
                    <Link to="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Login
                    </Link>
                    <Link to="/dispatcher" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Dispatcher
                    </Link>
                    <Link to="/driver" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Driver
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;