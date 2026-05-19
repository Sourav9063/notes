#!/usr/bin/env bash

read -r model_id ctx_used five_pct five_resets seven_pct seven_resets < <(
  cat | jq -r '[
    (.model.id // ""),
    (if (.context_window.used_percentage | type) == "number" then (.context_window.used_percentage | round | tostring) else "" end),
    (if (.rate_limits.five_hour.used_percentage | type) == "number" then (.rate_limits.five_hour.used_percentage | round | tostring) else "" end),
    (if (.rate_limits.five_hour.resets_at | type) == "number" then (.rate_limits.five_hour.resets_at | tostring) else "" end),
    (if (.rate_limits.seven_day.used_percentage | type) == "number" then (.rate_limits.seven_day.used_percentage | round | tostring) else "" end),
    (if (.rate_limits.seven_day.resets_at | type) == "number" then (.rate_limits.seven_day.resets_at | tostring) else "" end)
  ] | @tsv'
)

model_family=$(echo "$model_id" | sed 's/^claude-//' | cut -d'-' -f1)
model_short=$(echo "$model_family" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')

now=$(date +%s)

parts=()

[ -n "$model_short" ] && parts+=("$model_short")

[ -n "$ctx_used" ] && parts+=("CTX:${ctx_used}%")

if [ -n "$five_pct" ] && [ -n "$five_resets" ]; then
  secs_left=$(( five_resets - now ))
  if [ "$secs_left" -le 0 ]; then
    time_str="0m"
  else
    h=$(( secs_left / 3600 ))
    m=$(( (secs_left % 3600) / 60 ))
    [ "$h" -gt 0 ] && time_str="${h}h${m}m" || time_str="${m}m"
  fi
  parts+=("${five_pct}%:${time_str}")
fi

if [ -n "$seven_pct" ] && [ -n "$seven_resets" ]; then
  secs_left=$(( seven_resets - now ))
  if [ "$secs_left" -le 0 ]; then
    time_str="0d"
  else
    total_min=$(( secs_left / 60 ))
    days=$(( total_min / 1440 ))
    tenths=$(( (total_min % 1440) * 10 / 1440 ))
    time_str="${days}.${tenths}d"
  fi
  parts+=("${seven_pct}%:${time_str}")
fi

result=""
for part in "${parts[@]}"; do
  [ -z "$result" ] && result="$part" || result="${result} · ${part}"
done

echo "$result"
