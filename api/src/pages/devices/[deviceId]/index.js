import { PlusIcon, TrashIcon } from "@heroicons/react/solid";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../../components/button";
import ErrorComponent from "../../../components/error";
import Loading from "../../../components/loading";
import PinSelect from "../../../components/pinSelect";
import { withPrivateWrapper } from "../../../components/withPrivateWrapper";
import fetchJson from "../../../lib/fetchJson";

function DevicePage() {
  const { query } = useRouter();
  const [sensorsData, setSensorsData] = useState([]);
  const [error, setError] = useState();

  useEffect(() => {
    if (sensorsData.length === 0) return;

    setSensorsData((prevValue) =>
      prevValue.sort((a, _) => a.type === "digital"),
    );
  }, [sensorsData]);

  useEffect(() => {
    if (!query.deviceId) return;

    function fetchSensorData() {
      fetchJson(`/api/devices/${query.deviceId}/sensors`)
        .then((data) => {
          if (data) {
            setSensorsData(data);
          }
        })
        .catch(setError);
    }
    fetchSensorData();
  }, [query]);

  const activeSensors = useMemo(
    () => sensorsData.filter((s) => s.active),
    [sensorsData],
  );

  const handleCheck = (event) => {
    const sensorId = Number.parseInt(event.target.dataset.sensorId);
    const outputId = Number.parseInt(event.target.dataset.outputId);

    console.log(sensorId, outputId);

    setSensorsData((sd) =>
      sd.map((s) => {
        if (s.id === sensorId) {
          return {
            ...s,
            outputs: s.outputs.map((o) => {
              if (o.id === outputId) {
                o.active = !o.active;
              }
              return o;
            }),
          };
        }
        return s;
      }),
    );
  };

  const handlePinChange = useCallback(
    (sensorId, value) => {
      setSensorsData((sd) =>
        sd.map((s) => {
          if (s.id === Number.parseInt(sensorId)) {
            return { ...s, pin: value };
          }
          return s;
        }),
      );
    },
    [setSensorsData],
  );

  const handleRemoveSensor = useCallback(
    (event) => {
      const sensorId = Number.parseInt(event.target.dataset.sensorId);

      if (window.confirm("Are you sure you want to delete this sensor?")) {
        setSensorsData((sd) =>
          sd.map((s) => {
            if (s.id === sensorId) {
              return { ...s, active: false };
            }
            return s;
          }),
        );
      }
    },
    [setSensorsData],
  );

  const handleSaveStatus = useCallback(() => {
    let intervalId = null;
    const terminalStates = [
      "restart_failed",
      "sensors_fetch_failed",
      "sensors_publish_failed",
      "check_fetch_error",
      "done",
    ];

    intervalId = setInterval(() => {
      fetch(`/api/devices/${query.deviceId}/sensors/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);

          if (terminalStates.includes(data.status)) {
            clearInterval(intervalId);
          }
        })
        .catch((e) => {
          clearInterval(intervalId);
          console.log(e);
        });
    }, 250);
  }, [query.deviceId]);

  const handleSave = useCallback(() => {
    fetch(`/api/devices/${query.deviceId}/sensors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensorsData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error === false) return window.location.reload();

        console.log(data);

        handleSaveStatus();
      });
  }, [sensorsData, query.deviceId, handleSaveStatus]);

  if (error) {
    return <ErrorComponent description={error.message || "Unknown error."} />;
  }

  if (!error && sensorsData.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-2">
      {activeSensors.length === 0 && (
        <div className="py-24 text-center">
          You don&apos;t have any sensor :(
        </div>
      )}
      {activeSensors.map((data) => (
        <div key={data.id} className="bg-gray-700 p-2 rounded">
          <div className="flex flex-row items-center justify-between">
            <h2>{data.name} Sensor</h2>
            <div className="flex flex-row items-center space-x-2">
              <b className="mr-0.5">PIN:</b>{" "}
              <PinSelect
                pin={data.pin}
                pinType={data.type}
                handlePinChange={handlePinChange}
                id={data.id}
                className="w-20"
              />
              <button
                type="button"
                data-sensor-id={data.id}
                onClick={handleRemoveSensor}
              >
                <TrashIcon className="w-6 mr-2 text-rose-700 hover:bg-gray-500 hover:rounded-full active:text-gray-400" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {data.outputs.map((output) => (
              <div
                key={output.id}
                className="flex flex-row items-center space-x-2 bg-gray-500 p-2 rounded"
              >
                <input
                  id="default-checkbox"
                  type="checkbox"
                  data-sensor-id={data.id}
                  data-output-id={output.id}
                  onChange={handleCheck}
                  value=""
                  defaultChecked={output.active}
                  className="w-5 h-5 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="capitalize">{output.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-row justify-end">
        <Link href={`/devices/${query.deviceId}/addDevice`} passHref>
          <Button
            as={"a"}
            className="w-24 flex flex-row items-center justify-center"
          >
            <PlusIcon className="h-full w-4 align-middle inline-block" /> Add
          </Button>
        </Link>
        <Button onClick={handleSave} className="w-24">
          Save
        </Button>
      </div>
      <pre>{JSON.stringify(sensorsData, null, 2)}</pre>
    </div>
  );
}

export default withPrivateWrapper(DevicePage);
