
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Auth() {
  const { action = "login" } = useParams<{ action?: string }>();
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoginMode = action === "login";

  // Define schema based on auth mode
  const loginSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  });

  const signupSchema = loginSchema.extend({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
    confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(isLoginMode ? loginSchema : signupSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        await login(data.email, data.password);
      } else {
        await signup(data.email, data.password, data.fullName);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLoginMode ? "Sign In to Your Account" : "Create New Account"}
          </CardTitle>
          <CardDescription>
            {isLoginMode
              ? "Enter your email and password to access your dashboard"
              : "Fill out the form below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isLoginMode && (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isLoginMode && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : isLoginMode ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            {isLoginMode ? (
              <div>
                Don't have an account?{" "}
                <Link to="/auth/signup" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </div>
            ) : (
              <div>
                Already have an account?{" "}
                <Link to="/auth/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
