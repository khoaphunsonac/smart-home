"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Thermometer, Droplets, Sun, Lightbulb, Wind, Tv, Snowflake, Settings, Activity } from "lucide-react"
import { roomsAPI, devicesAPI, environmentAPI } from "@/lib/api"

export default function RoomDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = Number.parseInt(params.id as string)

  const [user, setUser] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [environmentData, setEnvironmentData] = useState<any>(null)
  const [deviceStates, setDeviceStates] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const loadRoomData = async () => {
      try {
        // Get room data with devices
        const roomResponse = await roomsAPI.getRoom(roomId.toString())
        if (!roomResponse.success) {
          router.push("/dashboard")
          return
        }

        const roomData = roomResponse.data.room
        setRoom(roomData)

        // Set devices from room data (if included) or fetch separately
        if (roomData.devices && Array.isArray(roomData.devices)) {
          setDevices(roomData.devices)

          // Initialize device states
          const initialStates: { [key: number]: boolean } = {}
          roomData.devices.forEach((device: any) => {
            initialStates[device.id] = device.isOn
          })
          setDeviceStates(initialStates)
        } else {
          // Fetch devices separately if not included
          const devicesResponse = await devicesAPI.getDevices({ room: roomId.toString() })
          if (devicesResponse.success && Array.isArray(devicesResponse.data.devices)) {
            setDevices(devicesResponse.data.devices)

            // Initialize device states
            const initialStates: { [key: number]: boolean } = {}
            devicesResponse.data.devices.forEach((device: any) => {
              initialStates[device.id] = device.isOn
            })
            setDeviceStates(initialStates)
          }
        }

        // Get environment data
        try {
          const envResponse = await environmentAPI.getLatestEnvironmentData(roomId.toString())
          if (envResponse.success) {
            setEnvironmentData(envResponse.data.environmentData)
          }
        } catch (envError) {
          console.log("No environment data available for this room")
        }

      } catch (error) {
        console.error("Error loading room data:", error)
        router.push("/dashboard")
      }
    }

    loadRoomData()
  }, [router, roomId])

  const toggleDevice = async (deviceId: number) => {
    try {
      const response = await devicesAPI.toggleDevice(deviceId.toString())
      if (response.success) {
        setDeviceStates((prev) => ({
          ...prev,
          [deviceId]: !prev[deviceId],
        }))
      }
    } catch (error) {
      console.error("Error toggling device:", error)
      // Fallback to local state update if API fails
      setDeviceStates((prev) => ({
        ...prev,
        [deviceId]: !prev[deviceId],
      }))
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "light":
        return <Lightbulb className="w-5 h-5" />
      case "ac":
        return <Snowflake className="w-5 h-5" />
      case "fan":
        return <Wind className="w-5 h-5" />
      case "tv":
        return <Tv className="w-5 h-5" />
      default:
        return <Settings className="w-5 h-5" />
    }
  }

  if (!room) {
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
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{room.name}</h1>
              <p className="text-sm text-muted-foreground">ID: {room.id}</p>
            </div>
            <Badge
              variant={room.isOccupied ? "default" : "secondary"}
              className={room.isOccupied ? "bg-primary text-primary-foreground" : ""}
            >
              {room.isOccupied ? "Đang sử dụng" : "Trống"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Environment Data Section */}
        {environmentData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Thông số môi trường</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Nhiệt độ</CardTitle>
                  <Thermometer className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">{environmentData.temperature}°C</div>
                  <p className="text-xs text-muted-foreground">
                    Cập nhật lúc {new Date(environmentData.timestamp).toLocaleTimeString("vi-VN")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Độ ẩm</CardTitle>
                  <Droplets className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">{environmentData.humidity}%</div>
                  <p className="text-xs text-muted-foreground">
                    Cập nhật lúc {new Date(environmentData.timestamp).toLocaleTimeString("vi-VN")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">Ánh sáng</CardTitle>
                  <Sun className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-card-foreground">{environmentData.lightLevel}</div>
                  <p className="text-xs text-muted-foreground">
                    Cập nhật lúc {new Date(environmentData.timestamp).toLocaleTimeString("vi-VN")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Device Control Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Điều khiển thiết bị</h2>
          {devices.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="w-12 h-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold text-card-foreground mb-2">Chưa có thiết bị</h4>
                <p className="text-muted-foreground text-center">Phòng này chưa có thiết bị nào được kết nối.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <Card key={device.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${deviceStates[device.id] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          {getDeviceIcon(device.type)}
                        </div>
                        <div>
                          <CardTitle className="text-card-foreground">{device.name}</CardTitle>
                          <CardDescription>{device.type}</CardDescription>
                        </div>
                      </div>
                      <Switch checked={deviceStates[device.id]} onCheckedChange={() => toggleDevice(device.id)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Trạng thái:</span>
                        <Badge variant={deviceStates[device.id] ? "default" : "secondary"}>
                          {deviceStates[device.id] ? "Bật" : "Tắt"}
                        </Badge>
                      </div>

                      {/* Additional controls based on device type */}
                      {device.type.toLowerCase() === "light" && deviceStates[device.id] && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Độ sáng</label>
                          <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
                        </div>
                      )}

                      {device.type.toLowerCase() === "ac" && deviceStates[device.id] && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Nhiệt độ (°C)</label>
                          <Slider defaultValue={[24]} min={16} max={30} step={1} className="w-full" />
                        </div>
                      )}

                      {device.type.toLowerCase() === "fan" && deviceStates[device.id] && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Tốc độ</label>
                          <Slider defaultValue={[3]} min={1} max={5} step={1} className="w-full" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Room Information */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Thông tin phòng</h2>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Cấu hình kết nối</CardTitle>
              <CardDescription>Thông tin kết nối Adafruit IO</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Adafruit Username:</span>
                  <span className="font-mono text-card-foreground">{room.adaUsername}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Key:</span>
                  <span className="font-mono text-card-foreground">{room.adakey.substring(0, 8)}***</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Số thiết bị:</span>
                  <span className="text-card-foreground">{devices.length} thiết bị</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trạng thái kết nối:</span>
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    <Activity className="w-3 h-3 mr-1" />
                    Đã kết nối
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
