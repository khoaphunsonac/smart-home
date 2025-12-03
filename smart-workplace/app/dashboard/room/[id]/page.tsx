"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, Thermometer, Droplets, Sun, Lightbulb, Wind, 
  Settings, Activity, RefreshCw, Trash2, AlertTriangle, Beaker, Snowflake, Tv
} from "lucide-react"
import { roomsAPI, devicesAPI, environmentAPI, adafruitAPI } from "@/lib/api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function RoomDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = Number.parseInt(params.id as string)

  const [user, setUser] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)
  const [feeds, setFeeds] = useState<any[]>([])
  const [environmentData, setEnvironmentData] = useState<any>(null)
  const [feedStates, setFeedStates] = useState<{ [key: string]: any }>({})
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [isRealtime, setIsRealtime] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const loadRoomData = async () => {
      try {
        setLoading(true)
        
        // Get room data
        const roomResponse = await roomsAPI.getRoom(roomId.toString())
        if (!roomResponse.success) {
          router.push("/dashboard")
          return
        }

        const roomData = roomResponse.data.room
        setRoom(roomData)

        // Get feeds from Adafruit IO
        try {
          const feedsResponse = await adafruitAPI.getFeeds(roomId.toString())
          if (feedsResponse.success && feedsResponse.data.feeds) {
            const allFeeds = feedsResponse.data.feeds
            setFeeds(allFeeds)

            // Initialize feed states from current feed values
            const initialStates: { [key: string]: any } = {}
            
            // Get current values for control feeds
            const controlFeedKeys = ['v11', 'v13', 'v14', 'v15', 'v16', 'v17']
            
            for (const feedKey of controlFeedKeys) {
              const feed = allFeeds.find((f: any) => f.key.toLowerCase() === feedKey)
              if (feed) {
                try {
                  const feedDataResponse = await adafruitAPI.getFeedData(roomId.toString(), feedKey, { limit: 1 })
                  if (feedDataResponse.success && feedDataResponse.data.length > 0) {
                    const currentValue = feedDataResponse.data[0].value
                    if (['v11', 'v13', 'v16', 'v17'].includes(feedKey)) {
                      // Toggle feeds - convert to boolean
                      initialStates[feedKey] = currentValue === '1' || currentValue === 1
                    } else if (['v14', 'v15'].includes(feedKey)) {
                      // Slider feeds - keep as number
                      initialStates[feedKey] = parseInt(currentValue) || 0
                    }
                  } else {
                    // Default values
                    if (['v11', 'v13', 'v16', 'v17'].includes(feedKey)) {
                      initialStates[feedKey] = false
                    } else {
                      initialStates[feedKey] = 0
                    }
                  }
                } catch (error) {
                  console.log(`Could not get data for feed ${feedKey}`)
                  if (['v11', 'v13', 'v16', 'v17'].includes(feedKey)) {
                    initialStates[feedKey] = false
                  } else {
                    initialStates[feedKey] = 0
                  }
                }
              }
            }
            
            setFeedStates(initialStates)
          }
        } catch (feedError) {
          console.log("Could not load feeds:", feedError)
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
      } finally {
        setLoading(false)
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

  const loadFeeds = async () => {
    setSyncing(true)
    setSyncMessage(null)
    
    try {
      const feedsResponse = await adafruitAPI.getFeeds(roomId.toString())
      if (feedsResponse.success && feedsResponse.data.feeds) {
        const allFeeds = feedsResponse.data.feeds
        setFeeds(allFeeds)
        
        // Reload feed states
        const initialStates: { [key: string]: any } = {}
        const controlFeedKeys = ['v11', 'v13', 'v14', 'v15', 'v16', 'v17']
        
        for (const feedKey of controlFeedKeys) {
          const feed = allFeeds.find((f: any) => f.key.toLowerCase() === feedKey)
          if (feed) {
            try {
              const feedDataResponse = await adafruitAPI.getFeedData(roomId.toString(), feedKey, { limit: 1 })
              if (feedDataResponse.success && feedDataResponse.data.length > 0) {
                const currentValue = feedDataResponse.data[0].value
                if (['v11', 'v13', 'v16', 'v17'].includes(feedKey)) {
                  initialStates[feedKey] = currentValue === '1' || currentValue === 1
                } else if (['v14', 'v15'].includes(feedKey)) {
                  initialStates[feedKey] = parseInt(currentValue) || 0
                }
              }
            } catch (error) {
              if (['v11', 'v13', 'v16', 'v17'].includes(feedKey)) {
                initialStates[feedKey] = false
              } else {
                initialStates[feedKey] = 0
              }
            }
          }
        }
        
        setFeedStates(initialStates)
        
        setSyncMessage({
          type: 'success',
          text: `Đã tải thành công ${allFeeds.length} feeds từ Adafruit IO!`
        })
        setTimeout(() => setSyncMessage(null), 5000)
      } else {
        setSyncMessage({
          type: 'error',
          text: 'Không thể tải feeds từ Adafruit IO'
        })
        setTimeout(() => setSyncMessage(null), 5000)
      }
    } catch (error: any) {
      console.error("Error loading feeds:", error)
      setSyncMessage({
        type: 'error',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi tải feeds'
      })
      setTimeout(() => setSyncMessage(null), 5000)
    }
    
    setSyncing(false)
  }



  // Pull realtime data from Adafruit IO
  const pullRealtimeData = async () => {
    try {
      const response = await adafruitAPI.pullEnvironmentData(roomId.toString())
      if (response.success) {
        setEnvironmentData(response.data.environmentData)
        // Reload historical data
        loadHistoricalData()
      }
    } catch (error: any) {
      console.error("Error pulling realtime data:", error)
    }
  }

  // Load historical data (last 5 minutes)
  const loadHistoricalData = async () => {
    try {
      const response = await environmentAPI.getEnvironmentData(roomId.toString(), { limit: 100 })
      if (response.success && response.data.environmentData) {
        // Filter data within last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const filteredData = response.data.environmentData.filter((item: any) => {
          return new Date(item.timestamp) >= fiveMinutesAgo
        }).reverse() // Reverse to show oldest first for charts
        
        setHistoricalData(filteredData)
      }
    } catch (error) {
      console.error("Error loading historical data:", error)
    }
  }

  // Auto-refresh realtime data every 10 seconds
  useEffect(() => {
    if (!isRealtime || !room) return

    loadHistoricalData() // Initial load

    const interval = setInterval(() => {
      pullRealtimeData()
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [isRealtime, room, roomId])

  const toggleFeed = async (feedKey: string) => {
    try {
      const newValue = feedStates[feedKey] ? '0' : '1'
      const response = await adafruitAPI.sendData(roomId.toString(), { feedKey, value: newValue })
      if (response.success) {
        setFeedStates((prev: any) => ({
          ...prev,
          [feedKey]: !prev[feedKey],
        }))
      }
    } catch (error) {
      console.error(`Error toggling feed ${feedKey}:`, error)
      // Fallback to local state update if API fails
      setFeedStates((prev: any) => ({
        ...prev,
        [feedKey]: !prev[feedKey],
      }))
    }
  }

  const updateSliderFeed = async (feedKey: string, value: number) => {
    try {
      const response = await adafruitAPI.sendData(roomId.toString(), { feedKey, value: value.toString() })
      if (response.success) {
        setFeedStates((prev: any) => ({
          ...prev,
          [feedKey]: value,
        }))
      }
    } catch (error) {
      console.error(`Error updating feed ${feedKey}:`, error)
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

        {/* Realtime Charts - Last 5 Minutes */}
        {historicalData.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">Biểu đồ theo thời gian thực (5 phút gần nhất)</h2>
              <div className="flex items-center gap-2">
                <Badge variant={isRealtime ? "default" : "secondary"}>
                  {isRealtime ? "Đang cập nhật" : "Đã dừng"}
                </Badge>
                <Button
                  onClick={() => setIsRealtime(!isRealtime)}
                  variant="outline"
                  size="sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {isRealtime ? "Tạm dừng" : "Bật realtime"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Temperature Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    Nhiệt độ (°C)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(time) => new Date(time).toLocaleTimeString("vi-VN", { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        tick={{ fontSize: 10 }}
                        stroke="currentColor"
                        opacity={0.5}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        stroke="currentColor"
                        opacity={0.5}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip 
                        labelFormatter={(time) => new Date(time).toLocaleTimeString("vi-VN")}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Humidity Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Độ ẩm (%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(time) => new Date(time).toLocaleTimeString("vi-VN", { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        tick={{ fontSize: 10 }}
                        stroke="currentColor"
                        opacity={0.5}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        stroke="currentColor"
                        opacity={0.5}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        labelFormatter={(time) => new Date(time).toLocaleTimeString("vi-VN")}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Light Level Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    Độ sáng (lux)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(time) => new Date(time).toLocaleTimeString("vi-VN", { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        tick={{ fontSize: 10 }}
                        stroke="currentColor"
                        opacity={0.5}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        stroke="currentColor"
                        opacity={0.5}
                        domain={['dataMin - 5', 'dataMax + 5']}
                      />
                      <Tooltip 
                        labelFormatter={(time) => new Date(time).toLocaleTimeString("vi-VN")}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lightLevel" 
                        stroke="#eab308" 
                        strokeWidth={2}
                        dot={{ fill: '#eab308', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Feed Control Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Điều khiển thiết bị</h2>
            <div className="flex items-center gap-2">
              <Button 
                onClick={loadFeeds} 
                disabled={syncing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Đang tải...' : 'Tải lại feeds'}
              </Button>
            </div>
          </div>
          
          {loading ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
              </CardContent>
            </Card>
          ) : feeds.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="w-12 h-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold text-card-foreground mb-2">Chưa có feeds</h4>
                <p className="text-muted-foreground text-center mb-4">
                  Phòng này chưa có feeds nào từ Adafruit IO.
                </p>
                <Button 
                  onClick={loadFeeds} 
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Đang tải...' : 'Tải feeds từ Adafruit IO'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sensor Feeds (v1, v2, v3) - Read Only */}
              {feeds.filter((feed: any) => ['v1', 'v2', 'v3'].includes(feed.key.toLowerCase())).map((feed: any) => (
                <Card key={feed.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                          {feed.key.toLowerCase() === 'v1' && <Thermometer className="w-5 h-5" />}
                          {feed.key.toLowerCase() === 'v2' && <Droplets className="w-5 h-5" />}
                          {feed.key.toLowerCase() === 'v3' && <Sun className="w-5 h-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-card-foreground">{feed.name}</CardTitle>
                          <CardDescription>{feed.key}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">Cảm biến</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Giá trị:</span>
                        <span className="text-lg font-bold text-card-foreground">
                          {feed.key.toLowerCase() === 'v1' && environmentData?.temperature && `${environmentData.temperature}°C`}
                          {feed.key.toLowerCase() === 'v2' && environmentData?.humidity && `${environmentData.humidity}%`}
                          {feed.key.toLowerCase() === 'v3' && environmentData?.lightLevel && `${environmentData.lightLevel} lux`}
                          {!environmentData && 'Đang đọc...'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cảm biến tự động cập nhật mỗi 10 giây
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Toggle Control Feeds (v11, v13, v16, v17) */}
              {feeds.filter((feed: any) => ['v11', 'v13', 'v16', 'v17'].includes(feed.key.toLowerCase())).map((feed: any) => (
                <Card key={feed.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${feedStates[feed.key.toLowerCase()] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          {feed.key.toLowerCase() === 'v11' && <Lightbulb className="w-5 h-5" />}
                          {feed.key.toLowerCase() === 'v13' && <Wind className="w-5 h-5" />}
                          {feed.key.toLowerCase() === 'v16' && <Lightbulb className="w-5 h-5" />}
                          {feed.key.toLowerCase() === 'v17' && <Lightbulb className="w-5 h-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-card-foreground">{feed.name}</CardTitle>
                          <CardDescription>{feed.key}</CardDescription>
                        </div>
                      </div>
                      <Switch 
                        checked={feedStates[feed.key.toLowerCase()] || false} 
                        onCheckedChange={() => toggleFeed(feed.key.toLowerCase())} 
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Trạng thái:</span>
                        <Badge variant={feedStates[feed.key.toLowerCase()] ? "default" : "secondary"}>
                          {feedStates[feed.key.toLowerCase()] ? "Bật" : "Tắt"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {feed.key.toLowerCase() === 'v11' && 'Đèn chính'}
                        {feed.key.toLowerCase() === 'v13' && 'Quạt thông gió'}
                        {feed.key.toLowerCase() === 'v16' && 'Đèn LED đỏ'}
                        {feed.key.toLowerCase() === 'v17' && 'Đèn LED tím'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Slider Control Feeds (v14, v15) */}
              {feeds.filter((feed: any) => ['v14', 'v15'].includes(feed.key.toLowerCase())).map((feed: any) => (
                <Card key={feed.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                          {feed.key.toLowerCase() === 'v14' && <Wind className="w-5 h-5" />}
                          {feed.key.toLowerCase() === 'v15' && <Droplets className="w-5 h-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-card-foreground">{feed.name}</CardTitle>
                          <CardDescription>{feed.key}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="default">Slider</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {feed.key.toLowerCase() === 'v14' ? 'Tốc độ quạt:' : 'Cường độ phun:'}
                        </span>
                        <span className="text-lg font-bold text-card-foreground">
                          {feedStates[feed.key.toLowerCase()] || 0}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Slider 
                          value={[feedStates[feed.key.toLowerCase()] || 0]} 
                          onValueChange={(value) => updateSliderFeed(feed.key.toLowerCase(), value[0])}
                          min={0} 
                          max={100} 
                          step={10} 
                          className="w-full" 
                        />
                        <p className="text-xs text-muted-foreground">
                          {feed.key.toLowerCase() === 'v14' ? 'Tốc độ quạt (0-100%)' : 'Cường độ phun sương (0-100%)'}
                        </p>
                      </div>
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
                  <span className="text-sm text-muted-foreground">Số feeds:</span>
                  <span className="text-card-foreground">{feeds.length} feeds</span>
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
