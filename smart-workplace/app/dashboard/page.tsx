"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Plus, Eye, LogOut, Users, Thermometer } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { roomsAPI } from "@/lib/api";

interface Room {
    id: string;
    name: string;
    description?: string;
    isOccupied: boolean;
    temperature?: {
        current?: number;
        target?: number;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout, loading } = useAuth();
    const [userRooms, setUserRooms] = useState<Room[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Chỉ redirect khi loading hoàn tất và chắc chắn không có user
        if (!loading && !user) {
            router.push("/login");
            return;
        }

        // Load rooms khi có user và không đang loading
        if (user && !loading) {
            loadRooms();
        }
    }, [user, loading, router]);

    const loadRooms = async () => {
        try {
            setLoadingRooms(true);
            const response = await roomsAPI.getRooms();
            setUserRooms(response.data || []);
        } catch (error: any) {
            setError(error.response?.data?.message || "Lỗi khi tải danh sách phòng");
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    // Hiển thị loading khi đang xử lý auth
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Đang xác thực...</p>
                </div>
            </div>
        );
    }

    // Không hiển thị gì nếu chưa có user (sẽ redirect)
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Home className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold text-foreground">SmartWorkplace</span>
                        </Link>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-muted-foreground">Xin chào, {user.name}!</span>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive">{error}</p>
                    </div>
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-card-foreground">Tổng phòng</CardTitle>
                            <Home className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-card-foreground">{userRooms.length}</div>
                            <p className="text-xs text-muted-foreground">Phòng được quản lý</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-card-foreground">
                                Phòng đang sử dụng
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-card-foreground">
                                {userRooms.filter((room) => room.isOccupied).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Phòng có người</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-card-foreground">
                                Nhiệt độ trung bình
                            </CardTitle>
                            <Thermometer className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-card-foreground">
                                {userRooms.length > 0 && userRooms.some((room) => room.temperature?.current)
                                    ? Math.round(
                                          (userRooms.reduce((total, room) => {
                                              return total + (room.temperature?.current || 24);
                                          }, 0) /
                                              userRooms.length) *
                                              10
                                      ) / 10
                                    : 24}
                                °C
                            </div>
                            <p className="text-xs text-muted-foreground">Trong tất cả các phòng</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Rooms Section */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-foreground">Danh sách phòng</h3>
                    <Button onClick={() => router.push("/dashboard/create-room")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm phòng mới
                    </Button>
                </div>

                {userRooms.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Home className="w-12 h-12 text-muted-foreground mb-4" />
                            <h4 className="text-lg font-semibold text-card-foreground mb-2">Chưa có phòng nào</h4>
                            <p className="text-muted-foreground text-center mb-6">
                                Bạn chưa thêm phòng nào. Hãy tạo phòng đầu tiên để bắt đầu sử dụng hệ thống.
                            </p>
                            <Button onClick={() => router.push("/dashboard/create-room")}>
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo phòng đầu tiên
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userRooms.map((room) => (
                            <Card
                                key={room.id}
                                className="bg-card border-border hover:border-primary/50 transition-colors"
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-card-foreground">{room.name}</CardTitle>
                                        <Badge
                                            variant={room.isOccupied ? "default" : "secondary"}
                                            className={room.isOccupied ? "bg-primary text-primary-foreground" : ""}
                                        >
                                            {room.isOccupied ? "Đang sử dụng" : "Trống"}
                                        </Badge>
                                    </div>
                                    <CardDescription>{room.description || "Không có mô tả"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {room.temperature && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Nhiệt độ:</span>
                                                <span className="text-card-foreground">
                                                    {room.temperature.current || 24}°C
                                                    {room.temperature.target &&
                                                        ` (Mục tiêu: ${room.temperature.target}°C)`}
                                                </span>
                                            </div>
                                        )}

                                        <div className="pt-3 flex space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => router.push(`/dashboard/room/${room.id}`)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Xem chi tiết
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
