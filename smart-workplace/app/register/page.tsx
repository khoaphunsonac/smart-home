"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Home, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        birthday: "",
        adaUsername: "",
        adakey: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự");
            setLoading(false);
            return;
        }
        if (!formData.adaUsername.trim()) {
            setError("Vui lòng nhập Adafruit Username");
            setLoading(false);
            return;
        }
        if (!formData.adakey.trim()) {
            setError("Vui lòng nhập Adafruit API Key");
            setLoading(false);
            return;
        }

        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.name,
                birthday: formData.birthday,
                adaUsername: formData.adaUsername,
                adakey: formData.adakey,
            });

            const newUser = {
                id: `U${Date.now()}`,
                username: formData.username,
                password: formData.password,
                name: formData.name,
                birthday: formData.birthday,
            };

            // Store user and redirect to login

            alert("Đăng ký thành công");

            localStorage.setItem("registeredUser", JSON.stringify(newUser));
            router.push("/login?registered=true");

            // router.push("/dashboard");
        } catch (error: any) {
            console.error("Register page error:", error);
            const errorMessage = error.message || "Đăng ký thất bại";
            setError(errorMessage);
            setLoading(false);
        }
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
                        <CardTitle className="text-2xl text-card-foreground">Đăng ký</CardTitle>
                        <CardDescription>Tạo tài khoản mới để sử dụng hệ thống</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert className="border-destructive/50 text-destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Họ và tên</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Nhập họ và tên"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="bg-input border-border"
                                />
                            </div>

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
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Nhập địa chỉ email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="bg-input border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birthday">Ngày sinh</Label>
                                <Input
                                    id="birthday"
                                    name="birthday"
                                    type="date"
                                    value={formData.birthday}
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
                                        placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
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

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="bg-input border-border pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adaUsername">Adafruit Username *</Label>
                                <Input
                                    id="adaUsername"
                                    name="adaUsername"
                                    type="text"
                                    placeholder="Nhập username Adafruit IO"
                                    value={formData.adaUsername}
                                    onChange={handleChange}
                                    required
                                    className="bg-input border-border font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Username tài khoản Adafruit IO để kết nối với thiết bị IoT
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adakey">Adafruit API Key *</Label>
                                <div className="relative">
                                    <Input
                                        id="adakey"
                                        name="adakey"
                                        type={showApiKey ? "text" : "password"}
                                        placeholder="Nhập API key từ Adafruit IO"
                                        value={formData.adakey}
                                        onChange={handleChange}
                                        required
                                        className="bg-input border-border font-mono pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                        {showApiKey ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">API key bảo mật để xác thực với dịch vụ Adafruit IO</p>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg text-sm">
                                <h4 className="font-semibold text-card-foreground mb-2">Hướng dẫn lấy thông tin Adafruit IO:</h4>
                                <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>Truy cập <span className="font-mono">io.adafruit.com</span></li>
                                    <li>Đăng nhập hoặc tạo tài khoản miễn phí</li>
                                    <li>Vào phần "My Key" để lấy Username và API Key</li>
                                    <li>Sao chép thông tin vào form này</li>
                                </ol>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-muted-foreground">
                                Đã có tài khoản?{" "}
                                <Link href="/login" className="text-primary hover:underline">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
