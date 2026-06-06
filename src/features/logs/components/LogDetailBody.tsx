import { Copy, Check } from "lucide-react"
import type { LogItem } from "@/core/models/logs"
import { formatDuration } from "@/core/utils/format"
import { maskedJson } from "@/core/utils/mask"
import { useCopy } from "@/shared/hooks/use-copy"

function Row({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  if (value == null || value === "") return null
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-1.5">
      <dt className="text-xs text-[rgb(var(--color-muted))]">{label}</dt>
      <dd className={`min-w-0 break-words text-xs text-[rgb(var(--color-fg))] ${mono ? "mono" : ""}`}>
        {value}
      </dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[rgb(var(--color-border)/0.08)] px-5 py-4 first:border-t-0">
      <h3 className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-[rgb(var(--color-muted))]">
        {title}
      </h3>
      <dl>{children}</dl>
    </section>
  )
}

/**
 * Cuerpo del detalle de un log (mensaje + secciones General/Actor/Target/HTTP/Meta).
 * Compartido por el drawer y la página de detalle para mantener una sola fuente de verdad.
 */
export function LogDetailBody({ log }: { log: LogItem }) {
  const { copy, copiedKey } = useCopy()
  const hasMeta = log.meta != null && Object.keys(log.meta).length > 0

  return (
    <>
      {log.message && (
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-[rgb(var(--color-fg-secondary))]">
            {log.message}
          </p>
        </div>
      )}

      <Section title="General">
        <Row label="Servicio" value={log.service} />
        <Row
          label="Request ID"
          value={
            log.requestId ? (
              <button
                type="button"
                onClick={() => copy(log.requestId!, "rid")}
                className="focus-ring inline-flex items-center gap-1.5 rounded text-[rgb(var(--color-fg))] hover:text-[rgb(var(--color-primary))]"
              >
                <span className="mono break-all">{log.requestId}</span>
                {copiedKey === "rid" ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--color-success))]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>
            ) : undefined
          }
        />
      </Section>

      {log.actor && (
        <Section title="Actor">
          <Row label="User ID" value={log.actor.userId} mono />
          <Row label="Email" value={log.actor.email} />
          <Row label="Rol" value={log.actor.role} />
        </Section>
      )}

      {log.target && (log.target.entity || log.target.id || log.target.email) && (
        <Section title="Target">
          <Row label="Entidad" value={log.target.entity} />
          <Row label="ID" value={log.target.id} mono />
          <Row label="Email" value={log.target.email} />
        </Section>
      )}

      {log.http && (
        <Section title="HTTP">
          <Row label="Método" value={log.http.method} mono />
          <Row label="Status" value={log.http.status} mono />
          <Row label="Ruta" value={log.http.path} mono />
          <Row label="Duración" value={formatDuration(log.http.durationMs)} />
          <Row label="IP" value={log.http.ip} mono />
          <Row label="User-Agent" value={log.http.userAgent} />
        </Section>
      )}

      {hasMeta && (
        <Section title="Meta">
          <pre className="mono overflow-x-auto rounded-lg bg-[rgb(var(--color-bg))] p-3 text-[0.7rem] leading-relaxed text-[rgb(var(--color-fg-secondary))]">
            {maskedJson(log.meta)}
          </pre>
        </Section>
      )}
    </>
  )
}
