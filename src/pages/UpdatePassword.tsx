
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

const UpdatePassword = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
