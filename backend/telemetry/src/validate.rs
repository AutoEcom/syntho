use crate::types::MetricsRecord;

const AGENT_ID_MAX: usize = 64;
const STATUS_MAX: usize = 32;

pub fn validate_record(agent_id: &str, record: &MetricsRecord) -> Result<(), String> {
    validate_agent_id(agent_id)?;
    if record.agent_id != agent_id {
        return Err("metrics.agent_id must match the agent_id argument".into());
    }
    validate_status(&record.status)?;

    let floats = [
        ("equity", record.equity),
        ("pnl_day", record.pnl_day),
        ("pnl_total", record.pnl_total),
        ("drawdown", record.drawdown),
        ("sharpe_90d", record.sharpe_90d),
        ("win_rate", record.win_rate),
    ];
    for (name, value) in floats {
        if !value.is_finite() {
            return Err(format!("{name} must be a finite number"));
        }
    }

    if !(0.0..=1.0).contains(&record.win_rate) {
        return Err("win_rate must be between 0 and 1".into());
    }

    Ok(())
}

pub fn validate_agent_id(agent_id: &str) -> Result<(), String> {
    if agent_id.is_empty() || agent_id.len() > AGENT_ID_MAX {
        return Err("agent_id must be 1–64 characters".into());
    }
    if !agent_id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("agent_id must be ASCII alphanumeric, hyphen, or underscore".into());
    }
    Ok(())
}

fn validate_status(status: &str) -> Result<(), String> {
    if status.is_empty() || status.len() > STATUS_MAX {
        return Err("status must be 1–32 characters".into());
    }
    if !status
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("status must be ASCII alphanumeric, hyphen, or underscore".into());
    }
    Ok(())
}
