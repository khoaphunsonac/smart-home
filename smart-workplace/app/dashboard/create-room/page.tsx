"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, ArrowLeft, Plus, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function CreateRoomPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    adaUsername: "",
    adakey: "",
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentUser = localStorage.getItem("user")
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(currentUser))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên phòng")
      setLoading(false)
      return
    }

    if (!formData.adaUsername.trim()) {
      setError("Vui lòng nhập Adafruit Username")
      setLoading(false)
      return
    }

    if (!formData.adakey.trim()) {
      setError("Vui lòng nhập Adafruit API Key")
      setLoading(false)
      return
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real app, you would send this to your API
    const newRoom = {
      id: Date.now(),
      name: formData.name,
      isOccupied: false,
      adaUsername: formData.adaUsername,
      adakey: formData.adakey,
      user_id: user.id,
    }

    // Store room (in real app, this would be saved to database)
    const existingRooms = JSON.parse(localStorage.getItem("userRooms") || "[]")
    existingRooms.push(newRoom)
    localStorage.setItem("userRooms", JSON.stringify(existingRooms))

    // Redirect back to dashboard
    router.push("/dashboard?roomCreated=true")

    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
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
          </div>

          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Tạo phòng mới</h2>
            <p className="text-muted-foreground">Thêm phòng làm việc thông minh vào hệ thống của bạn</p>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-card-foreground">
                <Plus className="w-5 h-5 mr-2" />
                Thông tin phòng mới
              </CardTitle>
              <CardDescription>Nhập thông tin cần thiết để kết nối và quản lý phòng thông minh</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert className="border-destructive/50 text-destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Tên phòng *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Ví dụ: Phòng họp A, Văn phòng chính..."
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">Đặt tên dễ nhận biết cho phòng của bạn</p>
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

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-card-foreground mb-2">Hướng dẫn lấy thông tin Adafruit IO:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>
                      Truy cập <span className="font-mono">io.adafruit.com</span>
                    </li>
                    <li>Đăng nhập hoặc tạo tài khoản miễn phí</li>
                    <li>Vào phần "My Key" để lấy Username và API Key</li>
                    <li>Sao chép thông tin vào form này</li>
                  </ol>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Đang tạo phòng...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo phòng
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={loading}>
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
