"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { fmt, formatDate, whatsappLink } from "@/lib/utils";
import { FORMULE_LABELS } from "@/lib/constants";
import type { Reservation, StatusType, FormulaType } from "@/lib/types";

const STATUS_LABELS: Record<StatusType, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};

function exportCSV(reservations: Reservation[]) {
  const headers = [
    "ID",
    "Date",
    "Nom",
    "Email",
    "Téléphone",
    "Formule",
    "Pack",
    "Début",
    "Fin",
    "Total TTC",
    "Acompte",
    "Statut",
    "Notes",
  ];
  const rows = reservations.map((r) => [
    r.id,
    new Date(r.createdAt).toLocaleDateString("fr-FR"),
    r.nom,
    r.email,
    r.telephone,
    r.formule,
    r.pack,
    r.dateDebut,
    r.dateFin ?? "",
    r.totalTTC.toFixed(2) + " €",
    r.acompte.toFixed(2) + " €",
    r.status,
    r.notes ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(";"))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pheno-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: StatusType }) {
  const icon = status === "pending" ? "⏳" : status === "confirmed" ? "✓" : "✕";
  return (
    <span className={`badge badge-${status}`}>
      {icon} {STATUS_LABELS[status]}
    </span>
  );
}

interface ReservationCardProps {
  reservation: Reservation;
  onStatusChange: (id: string, status: StatusType) => void;
}

function ReservationCard({
  reservation: r,
  onStatusChange,
}: ReservationCardProps) {
  const waMsg = `Bonjour ${r.nom}, votre réservation PHENO&CO du ${r.dateDebut} (${FORMULE_LABELS[r.formule]}) est ${r.status === "confirmed" ? "confirmée" : "en attente"}. Total : ${fmt(r.totalTTC)} — Acompte : ${fmt(r.acompte)}. Réf : ${r.id}`;

  return (
    <div className="res-card">
      <div className="res-head">
        <div>
          <div className="res-name">{r.nom}</div>
          <div className="res-contact">
            <a href={`mailto:${r.email}`}>{r.email}</a>
            {" · "}
            <a href={`tel:${r.telephone}`}>{r.telephone}</a>
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div className="res-details">
        <div>
          <div className="res-detail-label">Formule</div>
          <div className="res-detail-value">{FORMULE_LABELS[r.formule]}</div>
        </div>
        <div>
          <div className="res-detail-label">Pack</div>
          <div className="res-detail-value capitalize">{r.pack}</div>
        </div>
        <div>
          <div className="res-detail-label">Date</div>
          <div className="res-detail-value">
            {r.dateDebut}
            {r.dateFin ? ` → ${r.dateFin}` : ""}
            {r.heureDebut ? ` · ${r.heureDebut}–${r.heureFin}` : ""}
          </div>
        </div>
        <div>
          <div className="res-detail-label">Statut pro</div>
          <div className="res-detail-value capitalize">
            {r.statutPro.replace("-", " ")}
          </div>
        </div>
        <div>
          <div className="res-detail-label">Expérience</div>
          <div className="res-detail-value">{r.experience} ans</div>
        </div>
        <div>
          <div className="res-detail-label">Spécialités</div>
          <div className="res-detail-value">{r.specialites.join(", ")}</div>
        </div>
      </div>

      <div className="res-pricing">
        <div className="res-price-item">
          <div className="rp-label">HT</div>
          <div className="rp-value">{fmt(r.totalHT)}</div>
        </div>
        <div className="res-price-item">
          <div className="rp-label">TVA</div>
          <div className="rp-value">{fmt(r.tva)}</div>
        </div>
        <div className="res-price-item total">
          <div className="rp-label">Total TTC</div>
          <div className="rp-value">{fmt(r.totalTTC)}</div>
        </div>
        <div className="res-price-item deposit">
          <div className="rp-label">Acompte</div>
          <div className="rp-value">{fmt(r.acompte)}</div>
        </div>
        <div className="res-meta">
          Réf. {r.id}
          <br />
          {formatDate(r.createdAt)}
        </div>
      </div>

      {r.notes && (
        <div className="res-notes">
          <span className="res-detail-label">Notes</span>
          <p className="res-notes-text">{r.notes}</p>
        </div>
      )}

      <div className="res-actions">
        {r.status !== "confirmed" && (
          <button
            className="btn btn-success btn-sm"
            onClick={() => onStatusChange(r.id, "confirmed")}
          >
            ✓ Confirmer
          </button>
        )}
        {r.status !== "cancelled" && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onStatusChange(r.id, "cancelled")}
          >
            ✕ Annuler
          </button>
        )}
        {r.status === "cancelled" && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onStatusChange(r.id, "pending")}
          >
            ↩ Remettre en attente
          </button>
        )}
        <a
          href={whatsappLink(r.telephone, waMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-wa btn-sm"
        >
          💬 WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusType | "all">("all");
  const [filterFormule, setFilterFormule] = useState<FormulaType | "all">(
    "all",
  );
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const loadReservations = useCallback(async () => {
    const res = await fetch("/api/reservations");
    if (res.ok) setReservations(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/admin/check").then((r) => {
      if (r.ok) {
        setLoggedIn(true);
        loadReservations();
      }
      setLoading(false);
    });
  }, [loadReservations]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) {
      setLoggedIn(true);
      loadReservations();
    } else {
      setPwdError(true);
      setPwd("");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setReservations([]);
  }

  async function changeStatus(id: string, status: StatusType) {
    await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadReservations();
    const msg =
      status === "confirmed"
        ? "Réservation confirmée"
        : status === "cancelled"
          ? "Réservation annulée"
          : "Statut mis à jour";
    showToast(msg, "success");
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = useMemo(
    () =>
      reservations
        .filter((r) => filterStatus === "all" || r.status === filterStatus)
        .filter((r) => filterFormule === "all" || r.formule === filterFormule),
    [reservations, filterStatus, filterFormule],
  );

  const stats = useMemo(
    () => ({
      total: reservations.length,
      pending: reservations.filter((r) => r.status === "pending").length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
    }),
    [reservations],
  );

  if (loading) {
    return (
      <div className="admin-login">
        <span
          className="spinner"
          style={{ width: 32, height: 32, borderWidth: 3 }}
        />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>PHENO&CO</h1>
          <p>Espace administration — accès réservé</p>
          <form onSubmit={login}>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  className={`form-input${pwdError ? " error" : ""}`}
                  placeholder="Mot de passe"
                  value={pwd}
                  onChange={(e) => {
                    setPwd(e.target.value);
                    setPwdError(false);
                  }}
                  autoFocus
                  style={{ paddingRight: "2.8rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: "1rem",
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label={showPwd ? "Masquer" : "Afficher"}
                >
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
              {pwdError && (
                <p className="form-error">⚠ Mot de passe incorrect</p>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full login-submit"
            >
              Accéder au tableau de bord
            </button>
          </form>
          <div className="login-back">
            <Link href="/" className="back-link">
              ← Retour au formulaire
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className={`toast${toast ? ` show ${toast.type}` : ""}`}>
        <div className="toast-title">
          {toast?.type === "success" ? "✓" : "⚠"} {toast?.msg}
        </div>
      </div>

      <div className="admin-wrap">
        <div className="admin-header">
          <div>
            <Link href="/" className="back-link admin-breadcrumb">
              ← Retour au site
            </Link>
            <h1>Tableau de bord</h1>
          </div>
          <div className="admin-topbar">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => exportCSV(filtered)}
            >
              ⬇ Exporter CSV
            </button>
            <a
              href="https://wa.me/message/MZYDVEN32I55L1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa btn-sm"
            >
              💬 WhatsApp
            </a>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { label: "Total", value: stats.total, color: "var(--yellow)" },
            {
              label: "En attente",
              value: stats.pending,
              color: "var(--yellow)",
            },
            {
              label: "Confirmées",
              value: stats.confirmed,
              color: "var(--success)",
            },
            {
              label: "Annulées",
              value: stats.cancelled,
              color: "var(--error)",
            },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-number" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="filter-bar">
          <select
            className="form-select filter-select"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as StatusType | "all")
            }
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="cancelled">Annulé</option>
          </select>
          <select
            className="form-select filter-select"
            value={filterFormule}
            onChange={(e) =>
              setFilterFormule(e.target.value as FormulaType | "all")
            }
          >
            <option value="all">Toutes les formules</option>
            <option value="horaire">À l&apos;heure</option>
            <option value="demi-journee">Demi-journée</option>
            <option value="journee">Journée</option>
            <option value="semaine">Semaine</option>
            <option value="mois">Mensuel</option>
          </select>
          <span className="filter-count">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>Aucune réservation trouvée.</p>
          </div>
        ) : (
          <div className="res-list">
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="site-footer">
        <p>PHENO&CO — Administration</p>
      </footer>
    </main>
  );
}
