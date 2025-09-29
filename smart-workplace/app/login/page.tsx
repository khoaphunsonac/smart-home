"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Home, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { testAPI } from "@/lib/test-api";

export default function LoginPage() {
    const router = useRouter();
    const { login, user, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Redirect nếu đã đăng nhập
    useEffect(() => {
        if (!authLoading && user) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        console.log("Attempting login with:", { username: formData.username, password: "***" });

        try {
            await login(formData);
            console.log("Login successful, waiting for redirect...");
            // Không redirect ngay, để AuthContext handle redirect
        } catch (error: any) {
            console.error("Login form error:", error);
            console.error("Error details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            setError(error.message || "Đăng nhập thất bại");
            setLoading(false);
            return;
        }
        
        // Nếu không có lỗi, đợi một chút để AuthContext cập nhật
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">SmartWorkplace</span>
                    </Link>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-card-foreground">Đăng nhập</CardTitle>
                        <CardDescription>Nhập thông tin tài khoản để truy cập hệ thống</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert className="border-destructive/50 text-destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="username">Tên đăng nhập</Label>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Nhập tên đăng nhập"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className="bg-input border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Mật khẩu</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="bg-input border-border pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                            </Button>
                            
                            {/* Debug button */}
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full" 
                                onClick={async () => {
                                    try {
                                        const result = await testAPI();
                                        console.log('Test API result:', result);
                                        alert('Check console for API result');
                                    } catch (error) {
                                        console.error('Test API error:', error);
                                        alert('API test failed - check console for details');
                                    }
                                }}
                            >
                                Test API Connection
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-muted-foreground">
                                Chưa có tài khoản?{" "}
                                <Link href="/register" className="text-primary hover:underline">
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>

                        {/* Demo credentials */}
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Tài khoản demo:</p>
                            <div className="text-xs space-y-1">
                                <p>
                                    <strong>Username:</strong> khoatrandang020704 | <strong>Password:</strong> test123T
                                </p>
                                <p>
                                    <strong>Username:</strong> khoa123 | <strong>Password:</strong> 123456
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
