"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { roomsAPI, adafruitAPI } from "@/lib/api"

export default function CreateRoomPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    // Set a dummy user object since we have token
    setUser({ authenticated: true })
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

    try {
      // Call API to create room (Adafruit credentials are taken from user profile)
      const response = await roomsAPI.createRoom({
        name: formData.name,
      })

      if (response.success) {
        const newRoom = response.data.room
        const roomId = newRoom.id

        // Tự động sync devices từ Adafruit IO sau khi tạo phòng thành công
        try {
          const syncResponse = await adafruitAPI.syncDevices(roomId.toString())
          
          if (syncResponse.success) {
            // Redirect to room detail page để xem các devices đã sync
            router.push(`/dashboard/room/${roomId}?synced=true`)
          } else {
            console.warn("Failed to sync devices:", syncResponse.message)
            // Vẫn redirect đến room detail page nhưng không có query param synced
            router.push(`/dashboard/room/${roomId}`)
          }
        } catch (syncError: any) {
          console.error("Error syncing devices from Adafruit IO:", syncError)
          // Vẫn redirect đến room detail page dù sync fail
          router.push(`/dashboard/room/${roomId}?syncError=true`)
        }
      } else {
        setError(response.message || "Có lỗi xảy ra khi tạo phòng")
      }
    } catch (error: any) {
      console.error("Error creating room:", error)
      setError(error.response?.data?.message || "Có lỗi xảy ra khi tạo phòng")
    }

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
              <CardDescription>
                Nhập tên phòng để tạo. Thông tin Adafruit IO sẽ được lấy từ profile của bạn.
              </CardDescription>
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

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-card-foreground mb-2">📌 Lưu ý:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>
                      Phòng sẽ tự động kết nối với Adafruit IO sử dụng thông tin đã lưu trong profile của bạn
                    </li>
                    <li>Bạn có thể cập nhật thông tin Adafruit IO trong phần Cài đặt Profile</li>
                    <li>Sau khi tạo phòng, bạn có thể thêm thiết bị IoT vào phòng</li>
                  </ul>
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
