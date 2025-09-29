"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Plus, Eye, Settings, LogOut, Users, Thermometer } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { roomsAPI, devicesAPI } from "@/lib/api"

interface Room {
  id: string;
  name: string;
  description?: string;
  isOccupied: boolean;
  temperature?: {
    current?: number;
    target?: number;
  };
  devices?: any[];
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const [userRooms, setUserRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      loadRooms()
    }
  }, [user, loading, router])

  const loadRooms = async () => {
    try {
      setLoadingRooms(true)
      const response = await roomsAPI.getRooms()
      setUserRooms(response.data || [])
    } catch (error: any) {
      setError(error.response?.data?.message || "Lỗi khi tải danh sách phòng")
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getDeviceCount = async (roomId: string) => {
    try {
      const response = await devicesAPI.getDevices({ room: roomId })
      return response.data?.length || 0
    } catch (error) {
      return 0
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">SmartWorkplace</h1>
            </Link>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              Dashboard
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Xin chào, {user.name}!</h2>
          <p className="text-muted-foreground">Quản lý và điều khiển các phòng thông minh của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Tổng số phòng</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{userRooms.length}</div>
              <p className="text-xs text-muted-foreground">
                {userRooms.filter((room) => room.isOccupied).length} phòng đang sử dụng
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Thiết bị</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                {userRooms.reduce((total, room) => total + getDeviceCount(room.id), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Tổng thiết bị được quản lý</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Nhiệt độ trung bình</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                {userRooms.length > 0
                  ? Math.round(
                      (userRooms.reduce((total, room) => {
                        const envData = getEnvironmentData(room.id)
                        return total + (envData?.temperature || 0)
                      }, 0) /
                        userRooms.length) *
                        10,
                    ) / 10
                  : 0}
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
            {userRooms.map((room) => {
              const envData = getEnvironmentData(room.id)
              const deviceCount = getDeviceCount(room.id)

              return (
                <Card key={room.id} className="bg-card border-border hover:border-primary/50 transition-colors">
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
                    <CardDescription>ID: {room.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Adafruit User:</span>
                        <span className="font-mono text-card-foreground">{room.adaUsername}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">API Key:</span>
                        <span className="font-mono text-card-foreground">{room.adakey.substring(0, 6)}***</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Thiết bị:</span>
                        <span className="text-card-foreground">{deviceCount} thiết bị</span>
                      </div>

                      {envData && (
                        <div className="pt-3 border-t border-border">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-card-foreground font-semibold">{envData.temperature}°C</div>
                              <div className="text-muted-foreground">Nhiệt độ</div>
                            </div>
                            <div className="text-center">
                              <div className="text-card-foreground font-semibold">{envData.humidity}%</div>
                              <div className="text-muted-foreground">Độ ẩm</div>
                            </div>
                            <div className="text-center">
                              <div className="text-card-foreground font-semibold">{envData.lightLevel}</div>
                              <div className="text-muted-foreground">Ánh sáng</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="w-full mt-4 bg-transparent"
                        onClick={() => router.push(`/dashboard/room/${room.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
