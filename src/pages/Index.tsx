
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center space-y-6">
        <h1 className="text-3xl font-bold">Asset Management System</h1>
        <p className="text-gray-600">
          Manage your organization's assets efficiently with our powerful asset management system.
        </p>
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link to="/auth/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/auth/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
