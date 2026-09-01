"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

type Point = {
  latitude: number;
  longitude: number;
};

type NetworkLocation = Point & {
  available: boolean;
  city?: string;
};

const LAST_LOCATION_KEY = "momentum:last-location";

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
};

export function LocationPicker({
  value,
  onChange,
}: {
  value: Point | null;
  onChange: (point: Point) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const currentMarker = useRef<L.Marker | null>(null);
  const targetMarker = useRef<L.Marker | null>(null);
  const userMovedMap = useRef(false);
  const [status, setStatus] = useState(
    "지도를 움직이거나 터치해 약속 장소를 정하세요.",
  );

  useEffect(() => {
    let active = true;

    import("leaflet").then(({ default: Leaflet }) => {
      if (!active || !node.current) return;

      const instance = Leaflet.map(node.current, { zoomControl: false }).setView(
        [36.5, 127.8],
        7,
      );

      Leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(instance);
      Leaflet.control.zoom({ position: "bottomright" }).addTo(instance);

      const targetIcon = Leaflet.divIcon({
        className: "",
        html: '<span class="osm-marker target-marker">⌖</span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      instance.on("click", (event) => {
        userMovedMap.current = true;
        onChange({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        });
        setStatus("보라색 핀이 약속 장소예요.");
      });
      instance.on("dragstart", () => {
        userMovedMap.current = true;
      });

      map.current = instance;
      targetMarker.current = value
        ? Leaflet.marker([value.latitude, value.longitude], {
            icon: targetIcon,
          }).addTo(instance)
        : null;

      let rememberedLocationApplied = false;
      let networkLocationApplied = false;

      try {
        const remembered = JSON.parse(
          localStorage.getItem(LAST_LOCATION_KEY) ?? "null",
        ) as Point | null;
        if (
          remembered &&
          Number.isFinite(remembered.latitude) &&
          Number.isFinite(remembered.longitude) &&
          !value
        ) {
          instance.setView([remembered.latitude, remembered.longitude], 15);
          rememberedLocationApplied = true;
          setStatus("최근 내 위치를 표시했어요. GPS로 다시 확인하는 중…");
        }
      } catch {
        localStorage.removeItem(LAST_LOCATION_KEY);
      }

      void fetch("/api/location", { cache: "no-store" })
        .then((response) => response.json() as Promise<NetworkLocation>)
        .then((location) => {
          if (
            !active ||
            !location.available ||
            !Number.isFinite(location.latitude) ||
            !Number.isFinite(location.longitude) ||
            rememberedLocationApplied ||
            userMovedMap.current ||
            value
          ) {
            return;
          }

          instance.setView([location.latitude, location.longitude], 13);
          networkLocationApplied = true;
          setStatus(
            `${location.city ? `${location.city} ` : ""}접속 위치 주변이에요. 정확한 위치는 GPS 권한을 허용해 주세요.`,
          );
        })
        .catch(() => {
          // The browser GPS request below can still provide an exact location.
        });

      if (!navigator.geolocation) {
        if (!rememberedLocationApplied) {
          setStatus("접속 위치 주변을 불러오는 중…");
        }
        return;
      }

      if (!rememberedLocationApplied) {
        setStatus("현재 위치 주변을 불러오는 중…");
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!active) return;

          const preciseLocation: Point = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const point: [number, number] = [
            preciseLocation.latitude,
            preciseLocation.longitude,
          ];
          const currentIcon = Leaflet.divIcon({
            className: "",
            html: '<span class="osm-marker current-marker">●</span>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          currentMarker.current = Leaflet.marker(point, {
            icon: currentIcon,
          }).addTo(instance);
          localStorage.setItem(
            LAST_LOCATION_KEY,
            JSON.stringify(preciseLocation),
          );
          if (!userMovedMap.current && !value) {
            instance.setView(point, 16);
          }
          setStatus(
            "파란 점이 현재 GPS 위치예요. 지도를 터치해 약속 장소를 정하세요.",
          );
        },
        () => {
          if (!active || rememberedLocationApplied || networkLocationApplied) {
            return;
          }
          setStatus(
            "GPS 권한이 없어 접속 위치를 확인하고 있어요. '내 위치' 버튼으로 다시 시도할 수 있어요.",
          );
        },
        GEOLOCATION_OPTIONS,
      );
    });

    return () => {
      active = false;
      map.current?.remove();
      map.current = null;
      currentMarker.current = null;
      targetMarker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    import("leaflet").then(({ default: Leaflet }) => {
      const targetIcon = Leaflet.divIcon({
        className: "",
        html: '<span class="osm-marker target-marker">⌖</span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      if (!value) {
        targetMarker.current?.remove();
        targetMarker.current = null;
        return;
      }

      if (targetMarker.current) {
        targetMarker.current.setLatLng([value.latitude, value.longitude]);
      } else {
        targetMarker.current = Leaflet.marker(
          [value.latitude, value.longitude],
          { icon: targetIcon },
        ).addTo(map.current!);
      }
    });
  }, [value]);

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus("이 브라우저는 위치 기능을 지원하지 않아요.");
      return;
    }

    setStatus("현재 위치를 확인하는 중…");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const Leaflet = (await import("leaflet")).default;
        const instance = map.current;
        if (!instance) return;

        const point: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        const icon = Leaflet.divIcon({
          className: "",
          html: '<span class="osm-marker current-marker">●</span>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        if (currentMarker.current) {
          currentMarker.current.setLatLng(point);
        } else {
          currentMarker.current = Leaflet.marker(point, { icon }).addTo(instance);
        }

        localStorage.setItem(
          LAST_LOCATION_KEY,
          JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        );
        instance.setView(point, 16);
        setStatus(
          "현재 위치 주변이에요. 지도를 터치해 약속 장소를 정하세요.",
        );
      },
      () =>
        setStatus(
          "위치 권한을 허용해 주세요. 지도 터치만으로도 장소를 정할 수 있어요.",
        ),
      GEOLOCATION_OPTIONS,
    );
  };

  return (
    <section className="location-picker glass">
      <div className="location-title">
        <div>
          <strong>실제 지도에서 약속 위치</strong>
          <small>{status}</small>
        </div>
        <button type="button" onClick={locate}>
          내 위치
        </button>
      </div>
      <div
        ref={node}
        className="osm-map"
        aria-label="OpenStreetMap 약속 위치 선택 지도"
      />
      {value && (
        <p className="coordinate">
          저장할 위치: {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </p>
      )}
    </section>
  );
}
