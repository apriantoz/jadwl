import { Landmark, LogInIcon } from "lucide-react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <div className="hero min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <Landmark className="mx-auto h-24 w-24" />
          <h1 className="text-5xl font-bold">JadwL</h1>
          <Link to="/login" className="btn btn-primary mt-8">
            <LogInIcon />
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Hero;
