"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Thermometer, Droplets, Sun, Lightbulb, Wind, Tv, Snowflake, Settings, Activity, RefreshCw } from "lucide-react"
import { roomsAPI, devicesAPI, environmentAPI, adafruitAPI } from "@/lib/api"

export default function RoomDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = Number.parseInt(params.id as string)

  const [user, setUser] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [environmentData, setEnvironmentData] = useState<any>(null)
  const [deviceStates, setDeviceStates] = useState<{ [key: number]: boolean }>({})
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

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

  // Check for sync status from query params
  useEffect(() => {
    if (searchParams.get('synced') === 'true') {
      setSyncMessage({
        type: 'success',
        text: 'Đã tự động đồng bộ thiết bị từ Adafruit IO thành công!'
      })
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000)
    } else if (searchParams.get('syncError') === 'true') {
      setSyncMessage({
        type: 'error',
        text: 'Không thể đồng bộ thiết bị từ Adafruit IO. Vui lòng thử lại.'
      })
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }, [searchParams])

  const handleSyncDevices = async () => {
    setSyncing(true)
    setSyncMessage(null)
    
    try {
      const response = await adafruitAPI.syncDevices(roomId.toString())
      
      if (response.success) {
        const { createdDevices, deletedDevices, totalFeeds } = response.data
        
        // Reload devices
        const devicesResponse = await devicesAPI.getDevices({ room: roomId.toString() })
        if (devicesResponse.success && Array.isArray(devicesResponse.data.devices)) {
          setDevices(devicesResponse.data.devices)
          
          // Update device states
          const initialStates: { [key: number]: boolean } = {}
          devicesResponse.data.devices.forEach((device: any) => {
            initialStates[device.id] = device.isOn
          })
          setDeviceStates(initialStates)
        }
        
        setSyncMessage({
          type: 'success',
          text: `Đã đồng bộ ${createdDevices} thiết bị từ ${totalFeeds} feeds trên Adafruit IO!`
        })
        setTimeout(() => setSyncMessage(null), 5000)
      } else {
        setSyncMessage({
          type: 'error',
          text: response.message || 'Không thể đồng bộ thiết bị từ Adafruit IO'
        })
        setTimeout(() => setSyncMessage(null), 5000)
      }
    } catch (error: any) {
      console.error("Error syncing devices:", error)
      setSyncMessage({
        type: 'error',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi đồng bộ thiết bị'
      })
      setTimeout(() => setSyncMessage(null), 5000)
    }
    
    setSyncing(false)
  }

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

  const getDeviceIcon = (type: string, feedKey?: string) => {
    // Map by feed key first (more specific)
    if (feedKey) {
      const key = feedKey.toLowerCase()
      if (key.includes('v1') || key.includes('temperature')) return <Thermometer className="w-5 h-5" />
      if (key.includes('v2') || key.includes('humidity')) return <Droplets className="w-5 h-5" />
      if (key.includes('v3') || key.includes('light') || key.includes('lux')) return <Sun className="w-5 h-5" />
      if (key.includes('v10') || key.includes('sprayer') || key.includes('phun')) return <Droplets className="w-5 h-5" />
      if (key.includes('v11') || key.includes('v16') || key.includes('v17') || key.includes('v18') || key.includes('v19')) return <Lightbulb className="w-5 h-5" />
      if (key.includes('v12') || key.includes('fan') || key.includes('quat')) return <Wind className="w-5 h-5" />
    }
    
    // Fallback to type
    switch (type.toLowerCase()) {
      case "sensor":
      case "temperature":
        return <Thermometer className="w-5 h-5" />
      case "humidity":
        return <Droplets className="w-5 h-5" />
      case "light":
      case "led":
      case "rgb":
        return <Lightbulb className="w-5 h-5" />
      case "fan":
      case "quat":
        return <Wind className="w-5 h-5" />
      case "sprayer":
      case "humidifier":
        return <Droplets className="w-5 h-5" />
      case "ac":
        return <Snowflake className="w-5 h-5" />
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
        {/* Sync Message */}
        {syncMessage && (
          <div className="mb-6">
            <Alert className={`border ${syncMessage.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' : syncMessage.type === 'error' ? 'border-destructive/50 bg-destructive/10' : 'border-blue-500 bg-blue-50 dark:bg-blue-950'}`}>
              <AlertDescription className={syncMessage.type === 'success' ? 'text-green-700 dark:text-green-300' : syncMessage.type === 'error' ? 'text-destructive' : 'text-blue-700 dark:text-blue-300'}>
                {syncMessage.text}
              </AlertDescription>
            </Alert>
          </div>
        )}

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Điều khiển thiết bị</h2>
            <Button 
              onClick={handleSyncDevices} 
              disabled={syncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Đang đồng bộ...' : 'Đồng bộ từ Adafruit IO'}
            </Button>
          </div>
          {devices.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="w-12 h-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold text-card-foreground mb-2">Chưa có thiết bị</h4>
                <p className="text-muted-foreground text-center mb-4">
                  Phòng này chưa có thiết bị nào được kết nối.
                </p>
                <Button 
                  onClick={handleSyncDevices} 
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Đang đồng bộ...' : 'Đồng bộ thiết bị từ Adafruit IO'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => {
                const isSensor = device.feedKey && ['v1', 'v2', 'v3'].includes(device.feedKey.toLowerCase())
                
                return (
                  <Card key={device.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${!isSensor && deviceStates[device.id] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                          >
                            {getDeviceIcon(device.type, device.feedKey)}
                          </div>
                          <div>
                            <CardTitle className="text-card-foreground">{device.name}</CardTitle>
                            <CardDescription>
                              {device.feedKey ? `${device.type} (${device.feedKey})` : device.type}
                            </CardDescription>
                          </div>
                        </div>
                        {!isSensor && (
                          <Switch checked={deviceStates[device.id]} onCheckedChange={() => toggleDevice(device.id)} />
                        )}
                        {isSensor && (
                          <Badge variant="secondary">Cảm biến</Badge>
                        )}
                      </div>
                    </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Sensor devices - show read-only value */}
                      {isSensor ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Giá trị:</span>
                            <span className="text-lg font-bold text-card-foreground">
                              {device.feedKey?.toLowerCase() === 'v1' && environmentData?.temperature && `${environmentData.temperature}°C`}
                              {device.feedKey?.toLowerCase() === 'v2' && environmentData?.humidity && `${environmentData.humidity}%`}
                              {device.feedKey?.toLowerCase() === 'v3' && environmentData?.lightLevel && `${environmentData.lightLevel} lux`}
                              {!environmentData && 'Đang đọc...'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Cảm biến tự động cập nhật mỗi 10 giây
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Trạng thái:</span>
                            <Badge variant={deviceStates[device.id] ? "default" : "secondary"}>
                              {deviceStates[device.id] ? "Bật" : "Tắt"}
                            </Badge>
                          </div>

                          {/* Fan (V12) with speed control */}
                          {device.feedKey?.toLowerCase().includes('v12') && deviceStates[device.id] && (
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Tốc độ (%)</label>
                              <Slider defaultValue={[70]} min={0} max={100} step={10} className="w-full" />
                              <p className="text-xs text-muted-foreground">Điều khiển qua feed V14</p>
                            </div>
                          )}

                          {/* Sprayer (V10) with intensity control */}
                          {device.feedKey?.toLowerCase().includes('v10') && deviceStates[device.id] && (
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Cường độ (%)</label>
                              <Slider defaultValue={[70]} min={0} max={100} step={10} className="w-full" />
                              <p className="text-xs text-muted-foreground">Điều khiển qua feed V15</p>
                            </div>
                          )}

                          {/* RGB LEDs (V16-V19) with color indicator */}
                          {device.feedKey && ['v16', 'v17', 'v18', 'v19'].includes(device.feedKey.toLowerCase()) && deviceStates[device.id] && (
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Màu LED</label>
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full border-2 ${
                                  device.feedKey.toLowerCase() === 'v16' ? 'bg-red-500' :
                                  device.feedKey.toLowerCase() === 'v17' ? 'bg-purple-500' :
                                  device.feedKey.toLowerCase() === 'v18' ? 'bg-orange-500' :
                                  'bg-blue-500'
                                }`}></div>
                                <span className="text-sm">
                                  {device.feedKey.toLowerCase() === 'v16' && 'Đỏ'}
                                  {device.feedKey.toLowerCase() === 'v17' && 'Tím'}
                                  {device.feedKey.toLowerCase() === 'v18' && 'Cam'}
                                  {device.feedKey.toLowerCase() === 'v19' && 'Xanh dương'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Main Light (V11) */}
                          {device.feedKey?.toLowerCase().includes('v11') && deviceStates[device.id] && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Đèn chính (RGB LED 0)</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )
              })}
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
              <div className="space-y-4">                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Adafruit Username:</span>
                  <span className="font-mono text-card-foreground">{room.adaUsername || 'Chưa cấu hình'}</span>
                </div><div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Key:</span>
                  <span className="font-mono text-card-foreground">
                    {room.adakey ? `${room.adakey.substring(0, 8)}***` : 'Chưa cấu hình'}
                  </span>
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
