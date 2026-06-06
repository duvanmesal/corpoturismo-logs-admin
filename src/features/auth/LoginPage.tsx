import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Eye, EyeOff, ScrollText, LogIn, AlertCircle, Search, Activity, ShieldCheck } from "lucide-react"
import { useAuth } from "@/shared/hooks/use-auth"
import { extractApiError } from "@/core/utils/api-error"

const loginSchema = z.object({
  email: z.string().min(1, "Ingresa tu correo").email("Correo no válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
  rememberMe: z.boolean().optional(),
})
type LoginForm = z.infer<typeof loginSchema>

const appName = import.meta.env.VITE_APP_NAME || "Corpoturismo Logs Admin"

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
    login({ email: data.email, password: data.password, rememberMe: data.rememberMe })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca — institucional, sin hero centrado */}
      <aside className="app-grid-bg relative hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--color-primary)/0.14)] ring-1 ring-[rgb(var(--color-primary)/0.3)]">
            <ScrollText className="h-5 w-5 text-[rgb(var(--color-primary))]" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[rgb(var(--color-fg))]">
            Corpoturismo
          </span>
        </div>

        <div className="max-w-md">
          <p className="mb-3 text-sm font-medium text-[rgb(var(--color-primary))]">
            Hola de nuevo
          </p>
          <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight text-[rgb(var(--color-fg))]">
            La actividad de tu sistema,
            <br />
            clara y a la mano.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[rgb(var(--color-fg-secondary))]">
            Un panel tranquilo para revisar lo que pasa en la operación, sin ruido.
          </p>

          <ul className="mt-8 space-y-3.5">
            {[
              { icon: Search, text: "Busca y filtra registros en segundos" },
              { icon: Activity, text: "Sigue errores y eventos en un vistazo" },
              { icon: ShieldCheck, text: "Acceso auditado, solo lectura" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-[rgb(var(--color-fg-secondary))]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-primary)/0.12)] text-[rgb(var(--color-primary))]">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-[rgb(var(--color-muted))]">
          Corpoturismo · Panel de Logs
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center bg-[rgb(var(--color-bg))] p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-[rgb(var(--color-primary))]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[rgb(var(--color-fg))]">
                Corpoturismo
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--color-fg))]">
            Bienvenido
          </h2>
          <p className="mt-1.5 text-sm text-[rgb(var(--color-muted))]">
            Ingresa para entrar al {appName}
          </p>

          {loginError != null && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-lg border border-[rgb(var(--color-error)/0.25)] bg-[rgb(var(--color-error)/0.1)] px-3 py-2.5 text-sm text-[rgb(var(--color-error))]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{extractApiError(loginError)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[rgb(var(--color-fg-secondary))]">
                Correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                {...register("email")}
                className="focus-ring w-full rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3.5 py-2.5 text-sm text-[rgb(var(--color-fg))] placeholder:text-[rgb(var(--color-muted))]"
                placeholder="tu@correo.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-[rgb(var(--color-error))]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[rgb(var(--color-fg-secondary))]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className="focus-ring w-full rounded-lg border border-[rgb(var(--color-border)/0.16)] bg-[rgb(var(--color-surface))] px-3.5 py-2.5 pr-11 text-sm text-[rgb(var(--color-fg))] placeholder:text-[rgb(var(--color-muted))]"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-fg-secondary))]"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-[rgb(var(--color-error))]">{errors.password.message}</p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-[rgb(var(--color-fg-secondary))]">
              <input
                type="checkbox"
                {...register("rememberMe")}
                className="h-4 w-4 rounded border-[rgb(var(--color-border)/0.3)] bg-[rgb(var(--color-surface))] accent-[rgb(var(--color-primary))]"
              />
              Mantener sesión iniciada
            </label>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-primary))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--color-bg))] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {isLoggingIn ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
