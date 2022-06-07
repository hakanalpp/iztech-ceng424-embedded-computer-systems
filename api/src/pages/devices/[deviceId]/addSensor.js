/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/button";
import ErrorComponent from "../../../components/error";
import Loading from "../../../components/loading";
import PinSelect from "../../../components/pinSelect";
import RenderLabel from "../../../components/renderLabel";
import Select from "../../../components/select";
import { withPrivateWrapper } from "../../../components/withPrivateWrapper";
import fetchJson from "../../../lib/fetchJson";

const supportedSensors = [
  {
    name: "DHT",
    description:
      "The DHT sensors are made of two parts, a capacitive humidity sensor and a thermistor. It is used for measuring Temperature, Humidity and heatIndex data. and It looks like this.",
    image:
      "https://image.robotistan.com/dht11-isi-ve-nem-sensoru-kart-14197-17-O.jpg",
  },
  {
    name: "LDR",
    description:
      "LDR (Light Dependent Resistor) is a component that has a resistance that changes with the light intensity. This allows them to be used in sensing light. It measures light level and outputs as voltage level. It looks like this.",
    image: "https://5.imimg.com/data5/DE/KD/MY-25117786/ldr-sensor-500x500.jpg",
  },
];

function AddDevicePage() {
  const { query } = useRouter();
  const [sensorsData, setSensorsData] = useState([]);
  const [error, setError] = useState();
  const [sensor, setSensor] = useState();
  const [sensorInfo, setSensorInfo] = useState();

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
  }, [query.deviceId]);

  useEffect(() => {
    if (!sensor || sensor === "") return;

    const newSensorInfo = {
      ...(supportedSensors.find((s) => s.name === sensor) || {}),
      ...(sensorsData.find((s) => s.name === sensor) || {}),
    };

    setSensorInfo(newSensorInfo);
  }, [sensor, sensorsData]);

  const availableSensors = useMemo(
    () => sensorsData.filter((s) => !s.active),
    [sensorsData],
  );

  const handlePinChange = (sensorId, value) => {
    setSensorsData((sd) =>
      sd.map((s) => {
        if (s.id === sensorId) {
          return { ...s, pin: value };
        }
        return s;
      }),
    );
  };

  const handleCheck = (sensorId, outputId) => {
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

  if (error) {
    return <ErrorComponent description={error.message || "Unknown error."} />;
  }

  if (!error && sensorsData.length === 0) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col p-2 space-y-2">
      {RenderLabel("Supported Sensors", "supported-sensors")}
      <Select
        id="supported-sensors"
        name="supported-sensors"
        placeholder="Sensor"
        required
        onChange={setSensor}
        value={sensor}
      >
        {availableSensors.map((data) => (
          <Select.Option key={data.id} value={data.name} text={data.name} />
        ))}
      </Select>

      {sensorInfo?.name && (
        <div className="flex flex-col space-y-4">
          <div>{sensorInfo.description}</div>
          <img
            src={sensorInfo.image}
            alt="Sensor Image"
            width={240}
            height={240}
            className="self-center"
          />
          <div className="flex flex-row items-center">
            {RenderLabel("Sensor input pin:", "input-pin")}

            <span className="ml-4 mr-2">
              {sensorInfo.type === "digital" ? "D" : "A"}
            </span>
            <PinSelect
              pin={sensorInfo.pin}
              handlePinChange={handlePinChange}
              id={sensorInfo.id}
              pinList={sensorInfo.availablePins}
            />
          </div>

          <span>
            <b>Note:</b> D means it is digital ping, and A means it is Analog
            pin. Please make sure you put the pin to the right place
          </span>

          {RenderLabel("Desired outputs", "desired-output")}
          <div className="space-y-2">
            {sensorInfo?.outputs?.map((output) => (
              <div
                key={output.id}
                className="flex flex-row items-center space-x-2 bg-gray-500 p-2 rounded"
              >
                <input
                  id="default-checkbox"
                  type="checkbox"
                  onChange={() => handleCheck(sensorInfo.id, output.id)}
                  value=""
                  defaultChecked={output.active}
                  className="w-5 h-5 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="capitalize">{output.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="self-end mt-4">
        <Link href={""} passHref>
          <Button as={"a"} className="w-36">
            Save
          </Button>
        </Link>
      </div>
      {/* <pre>{JSON.stringify(sensorsData, null, 2)}</pre> */}
    </div>
  );
}

export default withPrivateWrapper(AddDevicePage);
