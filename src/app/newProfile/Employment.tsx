"use client";
import { LockOutlined } from "@ant-design/icons";
import { Timeline, Tag, Badge } from "antd";

const Employment = ({ data }: { data: any }) => {
  const job = data?.jobInformation;
  if (!job) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: "100%",
      }}
    >
      {/* ================= Job Information ================= */}
      <Badge.Ribbon
        text="Job Information"
        placement="end"
        style={{
          color: "#1677ff", // text color (blue)
          backgroundColor: "#1677ff",

          border: "1px solid rgba(22, 119, 255, 0.4)", // mirror effect
          backdropFilter: "blur(6px)", // glass / mirror feel (optional)
          fontSize: "12px",

          fontWeight: 600,
        }}
      >
        <div style={cardStyle}>
          <div style={grid3}>
            <Info label="DESIGNATION" value={job.designation} />
            <Info label="DEPARTMENT" value={job.department} />
            <Info label="TEAM" value={job.team} />
            <Info label="EMPLOYMENT TYPE" value={job.employeeType} />
            <Info label="WORK LOCATION" value={job.workLocation} />
            <Info label="WORK SHIFT" value={job.workShift} />
          </div>
        </div>
      </Badge.Ribbon>

      {/* ================= Employment Timeline ================= */}
      <Badge.Ribbon
        text=" Employment Timeline"
        placement="end"
        style={{
          color: "#1677ff", // text color (blue)
          backgroundColor: "#1677ff",

          border: "1px solid rgba(22, 119, 255, 0.4)", // mirror effect
          backdropFilter: "blur(6px)", // glass / mirror feel (optional)
          fontSize: "12px",

          fontWeight: 600,
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "14px",
            gap: "10px",
            flexDirection: "column",
            borderRadius: "10px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          }}
        >
          <Timeline
            style={{
              marginTop: "12px",
              paddingLeft: "4px", // 🔥 alignment fix
            }}
            items={[
              {
                dot: (
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#1677ff",
                      boxShadow: "0 0 0 4px rgba(22,119,255,0.2)",
                    }}
                  />
                ),
                children: (
                  <TimelineCard
                    title="DATE OF JOINING"
                    date="15 January 2022"
                    sub="2 years, 11 months ago"
                  />
                ),
              },
              {
                dot: (
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 0 4px rgba(34,197,94,0.2)",
                    }}
                  />
                ),
                children: (
                  <TimelineCard
                    title="CONFIRMATION DATE"
                    date="15 July 2022"
                    sub="After 6 months probation"
                  />
                ),
              },
            ]}
          />
        </div>
      </Badge.Ribbon>

      {/* ================= Reporting Structure ================= */}
      <Badge.Ribbon
        text="Reporting Manager"
        placement="end"
        style={{
          color: "#1677ff",
          backgroundColor: "#1677ff",
          border: "1px solid rgba(22, 119, 255, 0.4)",
          backdropFilter: "blur(6px)",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        <div style={cardStyle}>
          <div style={reportBox}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={avatar}>RK</div>

              <div>
                <div style={labelSmall}>REPORTING MANAGER</div>
                <div style={{ fontSize: "15px", fontWeight: 600 }}>Saroja</div>
                <div style={muted}>Project Manager</div>
              </div>
            </div>

            <button style={pillButton}>Direct Report</button>
          </div>
        </div>
      </Badge.Ribbon>
      {/* ================= Employment Status ================= */}
      <Badge.Ribbon
        text="Employment Status"
        placement="end"
        style={{
          color: "#1677ff", // text color (blue)
          backgroundColor: "#1677ff",

          border: "1px solid rgba(22, 119, 255, 0.4)", // mirror effect
          backdropFilter: "blur(6px)", // glass / mirror feel (optional)
          fontSize: "12px",

          fontWeight: 600,
        }}
      >
        <div style={cardStyle}>
          {/* <h3 style={sectionTitle}>Employment Status</h3> */}

          <div style={grid4}>
            <StatusCard
              title="CURRENT STATUS"
              value="Active"
              bg="#ecfdf5"
              color="#16a34a"
            />
            <StatusCard title="PROBATION" value="Completed" />
            <StatusCard title="NOTICE PERIOD" value="90 Days" />
            <StatusCard
              title="GRADE LEVEL"
              value={
                <Tag
                  style={{
                    background: "rgba(255, 99, 71, 0.15)",
                    color: "#fa541c",
                    border: "1px solid rgba(255, 99, 71, 0.4)",
                    borderRadius: "8px",
                    fontWeight: "600",
                    padding: "2px 10px",
                  }}
                >
                  {" "}
                  L5
                </Tag>
              }
            />
          </div>
        </div>
      </Badge.Ribbon>
    </div>
  );
};

/* ================= Reusable Parts ================= */

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={labelSmall}>{label}</div>
    <div style={infoValue}>
      {value}
      <LockOutlined style={{ fontSize: "12px", color: "#9ca3af" }} />
    </div>
  </div>
);

const TimelineCard = ({
  title,
  date,
  sub,
}: {
  title: string;
  date: string;
  sub: string;
}) => (
  <div style={{ marginBottom: "14px" }}>
    {/* <div style={timelineCard}> */}
    <div style={labelSmall}>{title}</div>
    <div style={{ fontSize: "15px", fontWeight: 600 }}>{date}</div>
    <div style={muted}>{sub}</div>
    {/* </div> */}
  </div>
);

const StatusCard = ({
  title,
  value,
  bg = "#f9fafb",
  color = "#111827",
}: {
  title: string;
  value: string | React.ReactNode;
  bg?: string;
  color?: string;
}) => (
  <div style={{ ...statusCard, background: bg }}>
    <div style={{ ...labelSmall, color }}>{title}</div>
    <div style={{ fontSize: "16px", fontWeight: 700, color }}>{value}</div>
  </div>
);

/* ================= Styles ================= */

const cardStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "18px 22px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  border: "1px solid #e5e7eb",
};

const sectionTitle = {
  fontSize: "16px",
  fontWeight: 600,
  marginBottom: "14px",
};

const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "14px 24px",
};

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "14px",
};

const labelSmall = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#6b7280",
  marginBottom: "4px",
};

const infoValue = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "14px",
  fontWeight: 500,
};

const muted = {
  fontSize: "12px",
  color: "#6b7280",
};

const timelineLine = {
  position: "absolute",
  left: "12px",
  top: 0,
  bottom: 0,
  width: "2px",
  background: "#c7d2fe",
};

const timelineCard = {
  background: "#ffffff",
  borderRadius: "12px",
  padding: "12px 16px",
  boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
  border: "1px solid #e5e7eb",
};

const reportBox = {
  background: "#f9fafb",
  borderRadius: "14px",
  padding: "14px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const avatar = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "#1677ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontWeight: 700,
};

const pillButton = {
  padding: "6px 14px",
  borderRadius: "999px",
  border: "none",
  background: "#eef2ff",
  color: "#1677ff",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const statusCard = {
  borderRadius: "14px",
  padding: "14px",
};
const titleStyle = {
  fontSize: "15px",
  fontWeight: 600,
  marginBottom: "14px",
  color: "#0f172a",
};

export default Employment;
