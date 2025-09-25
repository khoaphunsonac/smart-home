"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Shield, Zap, BarChart3, Users, Settings } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      setUser(JSON.parse(currentUser))
    }
  }, [])

  const features = [
    {
      icon: Home,
      title: "Quản lý phòng thông minh",
      description: "Thêm và quản lý các phòng làm việc với IoT",
    },
    {
      icon: Shield,
      title: "Bảo mật cao",
      description: "Xác thực người dùng và kiểm soát truy cập",
    },
    {
      icon: Zap,
      title: "Điều khiển thiết bị",
      description: "Điều khiển đèn, điều hòa, quạt từ xa",
    },
    {
      icon: BarChart3,
      title: "Giám sát môi trường",
      description: "Theo dõi nhiệt độ, độ ẩm, ánh sáng",
    },
    {
      icon: Users,
      title: "Quản lý người dùng",
      description: "Theo dõi lịch sử sử dụng phòng",
    },
    {
      icon: Settings,
      title: "Tự động hóa",
      description: "Điều chỉnh môi trường tự động",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">SmartWorkplace</h1>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-muted-foreground">Xin chào, {user.name}</span>
                <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem("currentUser")
                    setUser(null)
                  }}
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => router.push("/login")}>
                  Đăng nhập
                </Button>
                <Button onClick={() => router.push("/register")}>Đăng ký</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">
            Hệ thống quản lý không gian làm việc thông minh
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Tối ưu hóa môi trường làm việc với công nghệ IoT tiên tiến. Điều khiển thiết bị, giám sát môi trường và quản
            lý phòng một cách hiệu quả.
          </p>

          {!user && (
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" onClick={() => router.push("/register")}>
                Bắt đầu ngay
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/login")}>
                Đăng nhập
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-4">Tính năng nổi bật</h3>
          <p className="text-muted-foreground">Khám phá các tính năng mạnh mẽ của hệ thống SmartWorkplace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-card-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">© 2025 SmartWorkplace. Được phát triển bởi Nhóm 3 - ĐHBK TP.HCM</p>
        </div>
      </footer>
    </div>
  )
}
