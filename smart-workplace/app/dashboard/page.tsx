// ...existing code...
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Plus, Eye, LogOut, Users, Thermometer, ChevronDown, ChevronUp, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { roomsAPI, usageHistoryAPI } from "@/lib/api";

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

    // Added state for usage history
    const [usageHistory, setUsageHistory] = useState<any[]>([]);
    const [loadingUsage, setLoadingUsage] = useState(false);
    const [expandedUsage, setExpandedUsage] = useState(false);

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
            // roomsAPI.getRooms() trả về response.data (the parsed payload)
            const result = await roomsAPI.getRooms();
            console.log("Dashboard: getRooms result:", result);

            // Hỗ trợ nhiều dạng payload:
            // - { success: true, data: { rooms: [...] } }
            // - { success: true, rooms: [...] }
            // - trực tiếp mảng [...]
            const payload = result ?? {};
            const rooms =
                payload?.data?.rooms ||
                payload?.rooms ||
                (Array.isArray(payload) ? payload : []) ||
                [];

            console.log("Dashboard: Extracted rooms:", rooms);
            setUserRooms(Array.isArray(rooms) ? rooms : []);

            // Load usage history for all rooms
            await loadUsageHistory();
        } catch (error: any) {
            console.error("Dashboard: Load rooms error:", error);
            setError(error.response?.data?.message || "Lỗi khi tải danh sách phòng");
            setUserRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    const loadUsageHistory = async () => {
        try {
            setLoadingUsage(true);
            console.log("Dashboard: Loading usage history for all rooms");

            // Không filter theo room_id - lấy tất cả usage history của user
            const payload = await usageHistoryAPI.getUsageHistory({ limit: 10 });
            // API backend trả về: { success: true, data: { usageHistory, pagination } }
            const items =
                payload?.data?.usageHistory ||
                payload?.usageHistory ||
                (Array.isArray(payload) ? payload : []) ||
                [];

            console.log("Dashboard: usage history items loaded:", items.length, items);
            setUsageHistory(Array.isArray(items) ? items : []);
        } catch (err) {
            console.error("Dashboard: Load usage history error:", err);
            setUsageHistory([]);
        } finally {
            setLoadingUsage(false);
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
                            <div className="text-2xl font-bold text-card-foreground">{Array.isArray(userRooms) ? userRooms.length : 0}</div>
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
                                {Array.isArray(userRooms) ? userRooms.filter((room) => room.isOccupied).length : 0}
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

                {/* Usage History - Compact View */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-foreground">Lịch sử sử dụng thiết bị</h3>
                        {usageHistory.length > 3 && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setExpandedUsage(!expandedUsage)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {expandedUsage ? (
                                    <>
                                        <ChevronUp className="w-4 h-4 mr-1" />
                                        Thu gọn
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 mr-1" />
                                        Xem tất cả ({usageHistory.length})
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    <Card className="bg-card border-border">
                        <CardContent className="p-0">
                            {loadingUsage ? (
                                <div className="p-6 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">Đang tải lịch sử...</p>
                                </div>
                            ) : !usageHistory || usageHistory.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Chưa có bản ghi sử dụng thiết bị nào.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {(expandedUsage ? usageHistory : usageHistory.slice(0, 3)).map((u, idx) => (
                                        <div 
                                            key={u.id} 
                                            className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                                        >
                                            <div className="flex items-center space-x-3 flex-1">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <Zap className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-card-foreground truncate">
                                                            {u.deviceType || u.device_type || 'Unknown'}
                                                        </span>
                                                        {u.room?.name && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {u.room.name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {u.duration ? `${u.duration}s` : '-'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Zap className="w-3 h-3" />
                                                            {u.energyConsumed !== undefined ? `${u.energyConsumed} kWh` : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground ml-4 flex-shrink-0">
                                                {u.usageDate ? new Date(u.usageDate).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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

                {!Array.isArray(userRooms) || userRooms.length === 0 ? (
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
                        {Array.isArray(userRooms) && userRooms.map((room) => (
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
// ...existing code...