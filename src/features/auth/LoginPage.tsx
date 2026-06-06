import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Eye, EyeOff, ScrollText, LogIn, AlertCircle } from "lucide-react"
import { useAuth } from "@/shared/hooks/use-auth"
import { extractApiError } from "@/core/utils/api-error"

const loginSchema = z.object({
  email: z.string().min(1, "Ingresa tu correo").email("Correo no válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

const FACTS = [
  { label: "Retención de logs", value: "30 días" },
  { label: "Acceso", value: "Solo lectura" },
]

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  })

  const onSubmit = (data: LoginForm) => {
    login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    })
  }

  return (
    <div
      className="min-h-[100dvh] w-full px-5 py-8 sm:px-8 lg:px-10"
      style={{
        background: `rgb(var(--color-bg))`,
        backgroundImage: `
          radial-gradient(900px 600px at 15% 20%, rgba(var(--color-primary), 0.09), transparent 60%),
          radial-gradient(800px 520px at 85% 80%, rgba(var(--color-primary), 0.07), transparent 65%),
          radial-gradient(circle, rgba(var(--color-border), 0.05) 1px, transparent 1px)
        `,
        backgroundSize: `auto, auto, 24px 24px`,
      }}
    >
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-12">

          {/* ── Panel de marca ── */}
          <aside
            className="relative hidden overflow-hidden rounded-[2rem] p-10 lg:block xl:p-12"
            style={{
              /* backgroundColor separado para no cancelar el background-image de las clases */
              backgroundColor: `rgba(var(--color-surface), 0.62)`,
              backgroundImage: `
                radial-gradient(480px 380px at 90% -10%, rgba(var(--color-primary), 0.1), transparent 65%),
                radial-gradient(360px 300px at -10% 110%, rgba(var(--color-warn), 0.07), transparent 65%),
                radial-gradient(circle, rgba(var(--color-border), 0.045) 1px, transparent 1px)
              `,
              backgroundSize: `auto, auto, 26px 26px`,
              boxShadow: `
                0 24px 80px rgba(0, 0, 0, 0.22),
                inset 0 1px 0 rgba(var(--color-fg), 0.04)
              `,
            }}
          >
            {/* Stripe terracota superior — misma identidad visual que el form card */}
            <div
              aria-hidden="true"
              className="stat-card__stripe"
              style={{ background: `rgb(var(--color-primary))` }}
            />

            <div className="relative">
              {/* Logo */}
              <div className="mb-12 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    background: `rgba(var(--color-primary), 0.14)`,
                    boxShadow: `0 0 0 1px rgba(var(--color-primary), 0.26)`,
                  }}
                >
                  <ScrollText
                    className="h-4.5 w-4.5"
                    style={{ color: `rgb(var(--color-primary))` }}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className="text-[0.8125rem] font-bold tracking-tight"
                  style={{ color: `rgb(var(--color-fg))` }}
                >
                  Corpoturismo
                </span>
              </div>

              {/* Headline */}
              <div className="max-w-md">
                <div
                  className="mb-5 h-[3px] w-10 rounded-full"
                  style={{ background: `rgb(var(--color-primary))` }}
                />
                <h1
                  className="text-[2.65rem] font-bold leading-[1.08] tracking-tight xl:text-[3rem]"
                  style={{ color: `rgb(var(--color-fg))` }}
                >
                  La actividad
                  <br />
                  de tu sistema,
                  <br />
                  <span style={{ color: `rgb(var(--color-primary))` }}>
                    clara y a la mano.
                  </span>
                </h1>
                <p
                  className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed"
                  style={{ color: `rgb(var(--color-fg-secondary))` }}
                >
                  Un panel tranquilo para revisar lo que pasa en la operación,
                  sin ruido.
                </p>
              </div>

              {/* Facts — con acento lateral */}
              <div className="mt-9 grid max-w-md grid-cols-2 gap-3">
                {FACTS.map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-4"
                    style={{
                      background: `rgba(var(--color-bg), 0.5)`,
                      border: `1px solid rgba(var(--color-border), 0.15)`,
                      borderLeft: `2px solid rgba(var(--color-primary), 0.5)`,
                    }}
                  >
                    <p
                      className="text-[0.65rem] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: `rgb(var(--color-muted))` }}
                    >
                      {label}
                    </p>
                    <p
                      className="mt-1.5 text-xl font-bold tracking-tight"
                      style={{ color: `rgb(var(--color-fg))` }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                className="mt-8 flex items-center gap-2 border-t pt-6"
                style={{ borderColor: `rgba(var(--color-border), 0.1)` }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: `rgb(var(--color-success))` }}
                />
                <span className="text-xs" style={{ color: `rgb(var(--color-muted))` }}>
                  Sistema operativo
                </span>
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: `rgba(var(--color-primary), 0.4)` }}
                />
                <span className="text-xs" style={{ color: `rgb(var(--color-muted))` }}>
                  Corpoturismo · Panel de Logs · v2
                </span>
              </div>
            </div>
          </aside>

          {/* ── Panel de formulario ── */}
          <main className="flex w-full justify-center">
            <div className="w-full max-w-[390px]">

              {/* Logo mobile */}
              <div className="mb-7 flex items-center justify-center gap-2.5 lg:hidden">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    background: `rgba(var(--color-primary), 0.12)`,
                    boxShadow: `0 0 0 1px rgba(var(--color-primary), 0.22)`,
                  }}
                >
                  <ScrollText
                    className="h-4 w-4"
                    style={{ color: `rgb(var(--color-primary))` }}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: `rgb(var(--color-fg))` }}
                >
                  Corpoturismo
                </span>
              </div>

              <div
                className="animate-fade-in-up rounded-2xl p-7"
                style={{
                  background: `rgb(var(--color-surface))`,
                  border: `1px solid rgba(var(--color-border), 0.2)`,
                  boxShadow: `var(--shadow-lg), inset 0 1px 0 rgba(var(--color-fg), 0.04)`,
                  position: `relative`,
                  overflow: `hidden`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="stat-card__stripe"
                  style={{ background: `rgb(var(--color-primary))` }}
                />

                <h2
                  className="text-[1.4rem] font-bold tracking-tight"
                  style={{ color: `rgb(var(--color-fg))` }}
                >
                  Inicia sesión
                </h2>
                <p className="mt-1.5 text-sm" style={{ color: `rgb(var(--color-muted))` }}>
                  Accede al panel con tus credenciales
                </p>

                {loginError != null && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm"
                    style={{
                      border: `1px solid rgba(var(--color-error), 0.25)`,
                      background: `rgba(var(--color-error), 0.07)`,
                      color: `rgb(var(--color-error))`,
                    }}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{extractApiError(loginError)}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-[0.8125rem] font-semibold"
                      style={{ color: `rgb(var(--color-fg-secondary))` }}
                    >
                      Correo electrónico
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      autoFocus
                      {...register("email")}
                      className="focus-ring input-field w-full rounded-xl px-4 text-sm"
                      style={{
                        height: "2.875rem",
                        border: `1px solid rgba(var(--color-border), 0.28)`,
                        background: `rgba(var(--color-bg), 0.8)`,
                        color: `rgb(var(--color-fg))`,
                      }}
                      placeholder="tu@correo.com"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs" style={{ color: `rgb(var(--color-error))` }}>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-[0.8125rem] font-semibold"
                      style={{ color: `rgb(var(--color-fg-secondary))` }}
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        {...register("password")}
                        className="focus-ring input-field w-full rounded-xl px-4 pr-12 text-sm"
                        style={{
                          height: "2.875rem",
                          border: `1px solid rgba(var(--color-border), 0.28)`,
                          background: `rgba(var(--color-bg), 0.8)`,
                          color: `rgb(var(--color-fg))`,
                        }}
                        placeholder="••••••••"
                        aria-invalid={!!errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors"
                        style={{ color: `rgb(var(--color-muted))` }}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-xs" style={{ color: `rgb(var(--color-error))` }}>
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <label
                    className="flex cursor-pointer items-center gap-2.5 text-sm"
                    style={{ color: `rgb(var(--color-fg-secondary))` }}
                  >
                    <input
                      type="checkbox"
                      {...register("rememberMe")}
                      className="checkbox-field focus-ring"
                    />
                    Mantener sesión iniciada
                  </label>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="focus-ring panel-hover inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold tracking-wide active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                    style={{
                      background: `rgb(var(--color-primary))`,
                      color: `rgb(var(--color-bg))`,
                      boxShadow: `0 1px 2px rgba(var(--color-primary), 0.3), 0 6px 20px rgba(var(--color-primary), 0.25)`,
                    }}
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    {isLoggingIn ? "Ingresando…" : "Ingresar"}
                  </button>
                </form>
              </div>

              <p className="mt-4 text-center text-xs" style={{ color: `rgb(var(--color-muted))` }}>
                Acceso restringido a personal autorizado
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
