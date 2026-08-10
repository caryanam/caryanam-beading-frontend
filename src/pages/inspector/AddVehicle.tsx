import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  Gauge,
  Info,
  Layers,
  ShieldCheck,
  Star,
  Trash2,
  Video,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { inspectorNav } from "@/components/nav-config";
import { Panel } from "@/components/premium";
import { cn } from "@/lib/utils";
import {
  getInspectionDetails,
  saveInspectionDraft,
  updateInspectionDraft,
  uploadInspectionImage,
  submitInspectionReport,
  type InspectionDraftRequest,
} from "@/lib/api/inspector-api";

const steps = [
  { title: "Vehicle Specs", subtitle: "Basic registration & owner details" },
  { title: "Exterior Body", subtitle: "32-point panel & side photos" },
  { title: "Mechanical", subtitle: "Engine, oil & motor bay photos" },
  { title: "Tyres & Emergency", subtitle: "Tyre tread & wheel photos" },
  { title: "Interior & Media", subtitle: "Odometer & PDF report" },
];

/* Exact parameters extracted from Car Tattva Used Car Inspection PDF */
const exteriorPanels = [
  "Right Side Fender",
  "Right Side Front Door",
  "Right Side Rear Door",
  "Right Side Quarter Panel Window",
  "Right Side A Pillar",
  "Right Side B Pillar",
  "Right Side C Pillar",
  "Right Side Running Board",
  "Trunk Door (Dicky)",
  "Rear Bumper",
  "Left Side Rear Door",
  "Left Side Front Door",
  "Left Side Running Board",
  "Left Side Quarter Panel",
  "Left Side A Pillar",
  "Left Side B Pillar",
  "Left Side C Pillar",
  "Left Side Fender",
  "Right Side Mirror",
  "Left Side Mirror",
  "Front Bonnet Hood",
  "Front Bumper",
  "Front Wind Shield",
  "Rear Wind Shield",
  "Roof Top",
  "Chassis Embossing",
  "VIN Plate",
  "Under Body Damages",
  "Right Side Quarter Panel",
  "Right Side Front Window",
  "Left Side Quarter Panel Window",
];

const mechanicalItems = [
  { name: "Engine / Motor Status", type: "status" },
  {
    name: "Engine Oil",
    type: "fluid",
    options: ["OK", "NOT OK", "NEED CHANGE"],
  },
  {
    name: "Brakes Oil",
    type: "fluid",
    options: ["SATISFACTORY", "NEED REPLACEMENT", "NOT OK"],
  },
  { name: "Steering Oil", type: "fluid", options: ["OK", "NEED REPLACEMENT"] },
  {
    name: "Coolant",
    type: "fluid",
    options: ["OK", "NEED TO REPLACED", "LOW"],
  },
  { name: "Brakes Booster", type: "status" },
  { name: "Apron Condition", type: "status" },
  { name: "Chassis Alignment", type: "status" },
  { name: "Brakes Working", type: "status" },
  { name: "Suspension", type: "status" },
  { name: "Suspension Bushing", type: "status" },
  { name: "Oil Leakage", type: "status" },
  { name: "Exhaust Smoke Color", type: "text", default: "COLOURLESS" },
  { name: "Manual Transmission Fluid Level", type: "status" },
  { name: "Differential Fluid Level", type: "status" },
  { name: "Fluid Leakages", type: "text", default: "NO LEAKAGE" },
  { name: "Steering Gearbox & Linkage", type: "status" },
  { name: "Driveline / Axle", type: "status" },
  { name: "Engine / Motor Noise", type: "text", default: "NORMAL" },
];

const tyrePositions = [
  {
    id: "frontRight",
    label: "Front Right Tyre",
    defaultBrand: "JK 2019",
    imgKey: "rfTyreImg",
  },
  {
    id: "rearRight",
    label: "Rear Right Tyre",
    defaultBrand: "JK 2019",
    imgKey: "rrTyreImg",
  },
  {
    id: "rearLeft",
    label: "Rear Left Tyre",
    defaultBrand: "JK 2019",
    imgKey: "lrTyreImg",
  },
  {
    id: "frontLeft",
    label: "Front Left Tyre",
    defaultBrand: "JK 2019",
    imgKey: "lfTyreImg",
  },
  {
    id: "spareWheel",
    label: "Spare Tyre",
    defaultBrand: "Bridgestone 2015",
    imgKey: "spareWheelImg",
  },
];

const emergencyItems = [
  "Jack",
  "Handle",
  "Tool Kit",
  "First Aid Box",
  "Emergency Triangle",
];

const electricalItems = [
  "Right Side Tail Lamp",
  "Left Side Tail Lamp",
  "Right Side Head Light",
  "Left Side Head Light",
  "Right Indicator",
  "Left Indicator",
  "Boot Floor",
  "Washer Fluid",
  "Dashboard",
  "Left Side Fog Lamp",
  "Right Side Fog Lamp",
  "Rear Stop Light",
  "Power Window All Buttons",
  "Music System",
  "Adjustable Steering",
  "Steering Mounted Controls",
  "Wiper Washer Front",
  "Rear Defogger",
  "Rear Wiper Washer",
  "Instrument Cluster",
  "Infotainment System",
  "Central Lock",
  "Push Start Button",
  "Sunroof",
  "All Sensors",
];

const slotToCategoryMap: Record<string, string> = {
  frontSide: "Front",
  rightSide: "Right",
  rearSide: "Rear",
  leftSide: "Left",
  roofTop: "Roof",
  engineImg: "Engine",
  batteryImg: "Battery",
  rfTyreImg: "Front Right",
  rrTyreImg: "Rear Right",
  lrTyreImg: "Rear Left",
  lfTyreImg: "Front Left",
  spareWheelImg: "Spare",
  tyresGeneralImg: "Tyres",
  odometerImg: "Odometer",
  acImg: "AC Control",
};

const photoTypeToSlotKeyMap: Record<string, string> = {
  FRONT_VIEW: "frontSide",
  RIGHT_FRONT_VIEW: "rightSide",
  REAR_VIEW: "rearSide",
  LEFT_FRONT_VIEW: "leftSide",
  ROOF_VIEW: "roofTop",
  ENGINE_IMAGE: "engineImg",
  BATTERY_IMAGE: "batteryImg",
  FRONT_RIGHT_TYRE: "rfTyreImg",
  REAR_RIGHT_TYRE: "rrTyreImg",
  REAR_LEFT_TYRE: "lrTyreImg",
  FRONT_LEFT_TYRE: "lfTyreImg",
  SPARE_WHEEL: "spareWheelImg",
  TYRES_OVERVIEW: "tyresGeneralImg",
  ODOMETER_IMAGE: "odometerImg",
  AC_CONTROL_IMAGE: "acImg",
};

const mapCondition = (cond: string): string => {
  if (!cond) return "NA";
  const c = cond.toUpperCase().trim();
  if (
    c === "NO DAMAGES" ||
    c === "OK" ||
    c === "OK / WORKING" ||
    c === "WORKING" ||
    c === "SATISFACTORY"
  )
    return "OK";
  if (c === "DAMAGED") return "DAMAGED";
  if (c === "REPAINTED") return "REPAINTED";
  if (c === "CHANGED") return "CHANGED";
  if (c === "SCRATCH" || c === "SCRATCHES") return "SCRATCH";
  if (c === "DENT" || c === "DENTS") return "DENT";
  if (c === "RUST" || c === "RUSTED") return "RUST";
  return "NA";
};

/* Structured Photo Slots matching exact PDF report pages */
const imageSlotsConfig = [
  {
    key: "frontSide",
    label: "FRONT SIDE IMAGE",
    step: 1,
    pdfSection: "EXTERIOR",
    sample:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "rightSide",
    label: "RIGHT SIDE IMAGE",
    step: 1,
    pdfSection: "EXTERIOR",
    sample:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "rearSide",
    label: "REAR SIDE IMAGE",
    step: 1,
    pdfSection: "EXTERIOR",
    sample:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "leftSide",
    label: "LEFT SIDE IMAGE",
    step: 1,
    pdfSection: "EXTERIOR",
    sample:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "roofTop",
    label: "ROOF TOP IMAGE",
    step: 1,
    pdfSection: "EXTERIOR",
    sample:
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
  },

  {
    key: "engineImg",
    label: "ENGINE / MOTOR IMG",
    step: 2,
    pdfSection: "MECHANICAL",
    sample:
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "batteryImg",
    label: "BATTERY IMG",
    step: 2,
    pdfSection: "MECHANICAL",
    sample:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  },

  {
    key: "rfTyreImg",
    label: "RIGHT SIDE FRONT TYRE IMG",
    step: 3,
    pdfSection: "TYRE",
    sample:
      "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "rrTyreImg",
    label: "RIGHT SIDE REAR TYRE IMG",
    step: 3,
    pdfSection: "TYRE",
    sample:
      "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "lrTyreImg",
    label: "LEFT SIDE REAR TYRE IMG",
    step: 3,
    pdfSection: "TYRE",
    sample:
      "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "lfTyreImg",
    label: "LEFT SIDE FRONT TYRE IMG",
    step: 3,
    pdfSection: "TYRE",
    sample:
      "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "spareWheelImg",
    label: "SPARE WHEEL IMG",
    step: 3,
    pdfSection: "TYRE",
    sample:
      "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "tyresGeneralImg",
    label: "TYRES OVERVIEW IMAGE",
    step: 3,
    pdfSection: "TYRE",
    sample:
      "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80",
  },

  {
    key: "odometerImg",
    label: "ODOMETER IMG",
    step: 4,
    pdfSection: "INTERIOR AND ELECTRICAL",
    sample:
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "acImg",
    label: "AC IMAGE",
    step: 4,
    pdfSection: "INTERIOR AND ELECTRICAL",
    sample:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80",
  },
];

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110 cursor-pointer"
        >
          <Star
            className={cn(
              "size-5",
              star <= value
                ? "fill-[#FFC700] text-[#FFC700]"
                : "text-border fill-transparent",
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-xs font-bold text-foreground">
        {value} / 5 Stars
      </span>
    </div>
  );
}

function ImageSlotUploader({
  label,
  value,
  onChange,
  onRemove,
  error,
}: {
  label: string;
  value?: string;
  onChange: (file: File) => void;
  onRemove: () => void;
  error?: string;
}) {
  const handleFile = (files: FileList | null) => {
    if (!files || !files[0]) return;
    onChange(files[0]);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={cn(
          "rounded-2xl border p-4 shadow-soft transition-all flex flex-col justify-between min-h-[220px]",
          error
            ? "border-red-500 bg-red-50/5 hover:border-red-500"
            : "border-border bg-card hover:border-[#FFC700]/60",
        )}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-extrabold text-foreground tracking-wide uppercase truncate">
            {label}
          </span>
          {value ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="size-3" /> Captured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <AlertCircle className="size-3" /> Required
            </span>
          )}
        </div>

        {value ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border group bg-secondary">
            <img
              src={value}
              alt={label}
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => window.open(value, "_blank")}
                className="grid size-8 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-md hover:bg-white/40 cursor-pointer"
                title="View Image"
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="grid size-8 place-items-center rounded-xl bg-rose-600/80 text-white backdrop-blur-md hover:bg-rose-600 cursor-pointer"
                title="Remove Image"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/40 p-4 text-center transition-all hover:border-[#FFC700] hover:bg-[#FFC700]/10">
            <Camera className="size-6 text-[#FFC700]" />
            <p className="text-xs font-extrabold text-foreground">Upload Photo</p>
            <p className="text-[10px] font-semibold text-muted-foreground">
              Click to browse or drop file
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files)}
            />
          </label>
        )}
      </div>
      {error && (
        <span className="text-[10px] font-bold text-red-500 px-2 animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
}

const isValidRegNo = (regNo: string): boolean => {
  if (!regNo) return false;
  const clean = regNo.replace(/\s+/g, "").toUpperCase();
  // Standard format (e.g. MH12AB1234 or DL1C1234 or KA051234)
  const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/;
  // BH series format (e.g. 22BH1234A)
  const bhPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

  const isPureNumeric = /^\d+$/.test(clean);
  const isPureAlpha = /^[A-Z]+$/.test(clean);

  if (isPureNumeric || isPureAlpha) return false;

  return (standardPattern.test(clean) || bhPattern.test(clean)) && clean.length >= 6 && clean.length <= 12;
};

export function InspectorAddVehicle() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [inspectionId, setInspectionId] = useState<number | null>(null);

  const panelFileRef = useRef<HTMLInputElement>(null);
  const [activeUploadPanel, setActiveUploadPanel] = useState<string | null>(
    null,
  );

  const triggerPanelImageUpload = (panelName: string) => {
    setActiveUploadPanel(panelName);
    if (panelFileRef.current) {
      panelFileRef.current.value = "";
      panelFileRef.current.accept = panelName === "Engine / Motor Noise" ? "video/*" : "image/*";
      panelFileRef.current.click();
    }
  };

  const handlePanelImageChange = async (files: FileList | null) => {
    if (!files || !files[0] || !activeUploadPanel) return;
    const file = files[0];
    const panelName = activeUploadPanel;

    if (panelName === "Engine / Motor Noise") {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)$/i.test(file.name);
      if (!isVideo) {
        toast.error("Invalid file format. Please upload a video file for Engine / Motor Noise.");
        return;
      }
    } else {
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|heic|bmp|tiff)$/i.test(file.name);
      if (!isImage) {
        toast.error("Invalid file format. Please upload an image file.");
        return;
      }
    }

    let currentId = inspectionId;
    if (!currentId) {
      if (!basicDetails.regNo) {
        toast.error("Please enter the vehicle registration number first.");
        return;
      }
      try {
        const res = await saveDraftApiCall(false);
        if (res && res.data) {
          currentId = res.data.inspectionId || res.data.id;
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to initialize draft for image upload.");
        return;
      }
    }

    if (!currentId) return;

    try {
      const isVideo = panelName === "Engine / Motor Noise" || file.type.startsWith("video/");
      toast.info(`Uploading ${isVideo ? "video" : "photo"} for ${panelName}...`);
      const res = await uploadInspectionImage(currentId, panelName, file);
      if (res.success && res.data) {
        setPanelImages((prev) => ({
          ...prev,
          [panelName]: res.data,
        }));
        if (errors[panelName]) {
          setErrors((prev) => {
            const copy = { ...prev };
            delete copy[panelName];
            return copy;
          });
        }
        toast.success(`${isVideo ? "Video" : "Photo"} uploaded for ${panelName}!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload panel media.");
    }
  };
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State matching PDF inputs
  const [basicDetails, setBasicDetails] = useState({
    customerName: "",
    customerMobile: "",
    ownerName: "1st Owner",
    brand: "",
    model: "",
    variant: "",
    fuel: "Petrol",
    transmission: "Manual (MT)",
    year: "",
    regNo: "",
    odometer: "",
    insurance: "",
    evaluator: "",
    evalDate: new Date().toLocaleDateString("en-US"),
  });

  const [exteriorState, setExteriorState] = useState<Record<string, string>>(
    {},
  );
  const [panelImages, setPanelImages] = useState<Record<string, string>>({});
  const [exteriorRating, setExteriorRating] = useState(4);

  const [mechanicalState, setMechanicalState] = useState<
    Record<string, string>
  >({});
  const [mechanicalRating, setMechanicalRating] = useState(5);

  const [tyreState, setTyreState] = useState<
    Record<string, { condition: number; brand: string }>
  >({
    frontRight: { condition: 60, brand: "JK 2019" },
    rearRight: { condition: 60, brand: "JK 2019" },
    rearLeft: { condition: 60, brand: "JK 2019" },
    frontLeft: { condition: 60, brand: "JK 2019" },
    spareWheel: { condition: 40, brand: "Bridgestone 2015" },
  });
  const [tyreRating, setTyreRating] = useState(4);

  const [emergencyState, setEmergencyState] = useState<Record<string, boolean>>(
    {
      Jack: true,
      Handle: true,
      "Tool Kit": true,
      "First Aid Box": false,
      "Emergency Triangle": false,
    },
  );

  const [electricalState, setElectricalState] = useState<
    Record<string, string>
  >({
    "Battery Company": "",
    "Full Battery Number": "",
    AC: "",
  });
  const [electricalRating, setElectricalRating] = useState(4);

  const [comments, setComments] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");

  const [partImages, setPartImages] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!basicDetails.customerName) {
        newErrors.customerName = "Customer Name is required.";
      } else if (basicDetails.customerName.trim().length < 2) {
        newErrors.customerName = "Customer Name must be at least 2 characters.";
      }
      if (!basicDetails.customerMobile) {
        newErrors.customerMobile = "Customer Mobile Number is required.";
      } else if (!/^[6-9]\d{9}$/.test(basicDetails.customerMobile)) {
        newErrors.customerMobile = "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.";
      }
      if (!basicDetails.regNo) {
        newErrors.regNo = "Registration Number is required.";
      } else if (!isValidRegNo(basicDetails.regNo)) {
        newErrors.regNo = "Enter a valid registration number (e.g., MH12AB1234).";
      }
      if (!basicDetails.brand) {
        newErrors.brand = "Vehicle Brand / Make is required.";
      } else if (basicDetails.brand.trim().length < 2) {
        newErrors.brand = "Vehicle Brand / Make must be at least 2 characters.";
      }
      if (!basicDetails.model) {
        newErrors.model = "Model Name is required.";
      } else if (basicDetails.model.trim().length < 2) {
        newErrors.model = "Model Name must be at least 2 characters.";
      }
      if (!basicDetails.variant) {
        newErrors.variant = "Model Variant is required.";
      } else if (basicDetails.variant.trim().length < 2) {
        newErrors.variant = "Model Variant must be at least 2 characters.";
      }
      if (!basicDetails.year) newErrors.year = "Manufacturing Year is required.";
      if (!basicDetails.fuel) newErrors.fuel = "Fuel Type is required.";
      if (!basicDetails.transmission) newErrors.transmission = "Transmission is required.";
      if (!basicDetails.odometer) newErrors.odometer = "Odometer Reading is required.";
      if (!basicDetails.ownerName) newErrors.ownerName = "Owner Profile Status is required.";
      if (!basicDetails.insurance) newErrors.insurance = "Insurance Validity is required.";
      if (!suggestedPrice) {
        newErrors.suggestedPrice = "Suggested Price is required.";
      } else if (isNaN(Number(suggestedPrice.replace(/,/g, "")))) {
        newErrors.suggestedPrice = "Please enter a valid numeric price.";
      }
    } else if (stepIndex === 1) {
      const extSlots = ["frontSide", "rightSide", "rearSide", "leftSide", "roofTop"];
      extSlots.forEach((slot) => {
        if (!partImages[slot]) {
          const config = imageSlotsConfig.find((c) => c.key === slot);
          newErrors[slot] = `${config ? config.label : slot} photo is required.`;
        }
      });
      exteriorPanels.forEach((panel) => {
        if (!panelImages[panel]) {
          newErrors[panel] = `Photo is required for ${panel}.`;
        }
      });
    } else if (stepIndex === 2) {
      const mechSlots = ["engineImg", "batteryImg"];
      mechSlots.forEach((slot) => {
        if (!partImages[slot]) {
          const config = imageSlotsConfig.find((c) => c.key === slot);
          newErrors[slot] = `${config ? config.label : slot} photo is required.`;
        }
      });
      mechanicalItems.forEach((item) => {
        if (!panelImages[item.name]) {
          newErrors[item.name] = `Photo is required for ${item.name}.`;
        }
      });
    } else if (stepIndex === 3) {
      const tyreSlots = ["rfTyreImg", "rrTyreImg", "lrTyreImg", "lfTyreImg", "spareWheelImg", "tyresGeneralImg"];
      tyreSlots.forEach((slot) => {
        if (!partImages[slot]) {
          const config = imageSlotsConfig.find((c) => c.key === slot);
          newErrors[slot] = `${config ? config.label : slot} photo is required.`;
        }
      });
    } else if (stepIndex === 4) {
      if (!electricalState["Battery Company"]) newErrors["Battery Company"] = "Battery Company is required.";
      if (!electricalState["Full Battery Number"]) newErrors["Full Battery Number"] = "Full Battery Number is required.";
      if (!electricalState["AC"]) newErrors["AC"] = "AC Cooling Performance is required.";

      const intSlots = ["odometerImg", "acImg"];
      intSlots.forEach((slot) => {
        if (!partImages[slot]) {
          const config = imageSlotsConfig.find((c) => c.key === slot);
          newErrors[slot] = `${config ? config.label : slot} photo is required.`;
        }
      });
      electricalItems.forEach((item) => {
        if (!panelImages[item]) {
          newErrors[item] = `Photo is required for ${item}.`;
        }
      });
    }

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      toast.error("Please complete all required fields on the current step.");
    }
    return isValid;
  };

  // Parse ID query parameter on mount and load draft if present
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      setInspectionId(Number(id));
      loadInspectionData(Number(id));
    }
  }, []);

  const loadInspectionData = async (id: number) => {
    setLoading(true);
    try {
      const res = await getInspectionDetails(id);
      if (res.success && res.data) {
        const details = res.data;
        const v = details.vehicleDetails;

        if (v) {
          setBasicDetails({
            customerName: (v as any).customerName || "",
            customerMobile: (v as any).customerMobileNumber || "",
            ownerName: v.ownerName || "1st Owner",
            brand: v.brand || "",
            model: v.model || "",
            variant: v.variant || "",
            fuel: v.fuelType || "Petrol",
            transmission: v.transmission || "Manual (MT)",
            year: v.manufacturingYear ? v.manufacturingYear.toString() : "",
            regNo: v.vehicleNumber || "",
            odometer: v.odometerReading ? v.odometerReading.toString() : "",
            insurance: v.insuranceStatus || "",
            evaluator: v.inspectorCode || "",
            evalDate: v.inspectionDate
              ? new Date(v.inspectionDate).toLocaleDateString("en-US")
              : new Date().toLocaleDateString("en-US"),
          });
          setSuggestedPrice(
            v.suggestedPrice ? v.suggestedPrice.toLocaleString("en-IN") : "",
          );
        }

        if (details.ratings) {
          const r = details.ratings;
          const ext = r.exterior ?? r.exteriorRating;
          const mech = r.mechanical ?? r.mechanicalRating;
          const tyr = r.tyre ?? r.tyreRating;
          const int = r.interior ?? r.interiorRating;
          if (ext != null) setExteriorRating(Math.round(ext));
          if (mech != null) setMechanicalRating(Math.round(mech));
          if (tyr != null) setTyreRating(Math.round(tyr));
          if (int != null) setElectricalRating(Math.round(int));
        }

        if (details.exteriorPanelDetails) {
          const panelMap: Record<string, string> = {};
          const pImageMap: Record<string, string> = {};
          details.exteriorPanelDetails.forEach((p: any) => {
            panelMap[p.panelName] = p.condition;
            if (p.imageUrl) {
              pImageMap[p.panelName] = p.imageUrl;
            }
          });
          setExteriorState(panelMap);
          setPanelImages(pImageMap);
        }

        if (details.mechanicalDetails) {
          const mech = details.mechanicalDetails;
          setMechanicalState({
            "Engine / Motor Status": mech.engineStatus || "OK",
            "Engine Oil": mech.engineOil || "OK",
            "Brakes Oil": mech.brakeOil || "SATISFACTORY",
            "Steering Oil": mech.steeringOil || "OK",
            Coolant: mech.coolant || "OK",
            "Brakes Booster": mech.brakeBooster || "OK",
            "Brakes Working": mech.brakeWorking || "OK",
            "Apron Condition": mech.apron || "OK",
            "Chassis Alignment": mech.chassis || "OK",
            Suspension: mech.suspension || "OK",
            "Suspension Bushing": mech.bush || "OK",
            "Oil Leakage": mech.leakage || "OK",
            "Exhaust Smoke Color": mech.smoke || "COLOURLESS",
            "Manual Transmission Fluid Level": mech.transmission || "OK",
            "Differential Fluid Level": mech.differential || "OK",
            "Fluid Leakages": mech.fluidLeakage || "NO LEAKAGE",
            "Steering Gearbox & Linkage": mech.gearbox || "OK",
            "Driveline / Axle": mech.axle || "OK",
            "Engine / Motor Noise": mech.engineNoise || "NORMAL",
          });
        }

        if (details.tyreDetails) {
          const t = details.tyreDetails;
          setTyreState({
            frontRight: {
              condition: t.frontRightTread || 60,
              brand: t.frontRightBrand || "JK 2019",
            },
            rearRight: {
              condition: t.rearRightTread || 60,
              brand: t.rearRightBrand || "JK 2019",
            },
            rearLeft: {
              condition: t.rearLeftTread || 60,
              brand: t.rearLeftBrand || "JK 2019",
            },
            frontLeft: {
              condition: t.frontLeftTread || 60,
              brand: t.frontLeftBrand || "JK 2019",
            },
            spareWheel: {
              condition: t.spareTread || 40,
              brand: t.spareBrand || "Bridgestone 2015",
            },
          });
          setEmergencyState({
            Jack: t.hasJack || false,
            Handle: t.hasHandle || false,
            "Tool Kit": t.hasToolkit || false,
            "First Aid Box": t.hasFirstAidBox || false,
            "Emergency Triangle": t.hasTriangle || false,
          });
        }

        if (details.interiorDetails) {
          const int = details.interiorDetails;
          setElectricalState({
            "Battery Company": int.batteryBrand || "",
            "Full Battery Number": int.batterySerialNumber || "",
            AC: int.acCooling || "",
            "Push Start Button": int.pushButton || "OK / WORKING",
            Sunroof: int.sunroof || "OK / WORKING",
            "Right Side Tail Lamp": int.rightTailLamp || "OK / WORKING",
            "Left Side Tail Lamp": int.leftTailLamp || "OK / WORKING",
            "Right Side Head Light": int.rightHeadLamp || "OK / WORKING",
            "Left Side Head Light": int.leftHeadLamp || "OK / WORKING",
            "Right Indicator": int.indicators || "OK / WORKING",
            "Left Indicator": int.indicators || "OK / WORKING",
            "Boot Floor": int.bootFloor || "OK / WORKING",
            Dashboard: int.dashboard || "OK / WORKING",
            "Left Side Fog Lamp": int.fogLamps || "OK / WORKING",
            "Right Side Fog Lamp": int.fogLamps || "OK / WORKING",
            "Power Window All Buttons": int.powerWindows || "OK / WORKING",
            "Music System": int.musicSystem || "OK / WORKING",
            "Steering Mounted Controls":
              int.steeringMountedControls || "OK / WORKING",
            "Wiper Washer Front": int.wiper || "OK / WORKING",
            "Rear Defogger": int.rearDefogger || "OK / WORKING",
            "Rear Wiper Washer": int.rearWasher || "OK / WORKING",
            "Instrument Cluster": int.instrumentCluster || "OK / WORKING",
            "Infotainment System": int.infotainment || "OK / WORKING",
            "Central Lock": int.centralLock || "OK / WORKING",
            "All Sensors": int.sensors || "OK / WORKING",
          });
          setComments(int.remarks || "");
        }

        if (details.inspectionPhotos) {
          const imageMap: Record<string, string> = {};
          const checklistImageMap: Record<string, string> = {};

          const allChecklistNames = [
            ...exteriorPanels,
            ...mechanicalItems.map((m) => m.name),
            ...electricalItems,
            "Battery Company",
            "Full Battery Number",
          ];

          details.inspectionPhotos.forEach((img: any) => {
            if (!img.imageUrl) return;

            let slotKey = img.photoType ? photoTypeToSlotKeyMap[img.photoType] : undefined;
            if (!slotKey) {
              const cat = img.imageCategory || img.displayName || "";
              slotKey = Object.keys(slotToCategoryMap).find(
                (k) => slotToCategoryMap[k].toLowerCase() === cat.toLowerCase()
              );
            }

            if (slotKey) {
              imageMap[slotKey] = img.imageUrl;
            }

            const rawCat = img.imageCategory || img.displayName;
            if (rawCat) {
              checklistImageMap[rawCat] = img.imageUrl;
              const matchName = allChecklistNames.find(
                (name) => name.trim().toLowerCase() === rawCat.trim().toLowerCase()
              );
              if (matchName) {
                checklistImageMap[matchName] = img.imageUrl;
              }
            }
          });

          setPartImages((p) => ({ ...p, ...imageMap }));
          setPanelImages((p) => ({ ...p, ...checklistImageMap }));
        }
      }
    } catch (err: any) {
      console.error("Failed to load inspection details", err);
      toast.error(err.response?.data?.message || "Failed to fetch inspection details from server.");
    } finally {
      setLoading(false);
    }
  };

  const saveDraftApiCall = async (showToast = true): Promise<any> => {
    if (!basicDetails.regNo || !isValidRegNo(basicDetails.regNo)) {
      toast.error(
        "Enter a valid registration number (e.g., MH12AB1234).",
      );
      throw new Error("Invalid registration number");
    }

    setSaving(true);
    try {
      const payload: InspectionDraftRequest = {
        vehicleDetails: {
          vehicleNumber: basicDetails.regNo,
          ownerName: basicDetails.ownerName || "1st Owner",
          customerName: basicDetails.customerName,
          customerMobileNumber: basicDetails.customerMobile,
          brand: basicDetails.brand,
          model: basicDetails.model,
          variant: basicDetails.variant,
          manufacturingYear: parseInt(basicDetails.year) || undefined,
          fuelType: basicDetails.fuel,
          transmission: basicDetails.transmission,
          odometerReading: parseInt(basicDetails.odometer) || undefined,
          insuranceStatus: basicDetails.insurance,
          inspectorCode: basicDetails.evaluator || "",
          suggestedPrice:
            parseFloat(suggestedPrice.replace(/,/g, "")) || undefined,
        },
        exteriorPanelDetails: exteriorPanels.map((panelName) => ({
          panelName,
          condition: mapCondition(exteriorState[panelName] || "OK") as any,
          imageUrl: panelImages[panelName] || undefined,
        })),
        mechanicalDetails: {
          engineStatus: mechanicalState["Engine / Motor Status"] || "OK",
          engineOil: mechanicalState["Engine Oil"] || "OK",
          brakeOil: mechanicalState["Brakes Oil"] || "SATISFACTORY",
          steeringOil: mechanicalState["Steering Oil"] || "OK",
          coolant: mechanicalState["Coolant"] || "OK",
          brakeBooster: mechanicalState["Brakes Booster"] || "OK",
          brakeWorking: mechanicalState["Brakes Working"] || "OK",
          apron: mechanicalState["Apron Condition"] || "OK",
          chassis: mechanicalState["Chassis Alignment"] || "OK",
          suspension: mechanicalState["Suspension"] || "OK",
          bush: mechanicalState["Suspension Bushing"] || "OK",
          leakage: mechanicalState["Oil Leakage"] || "OK",
          smoke: mechanicalState["Exhaust Smoke Color"] || "COLOURLESS",
          transmission:
            mechanicalState["Manual Transmission Fluid Level"] || "OK",
          differential: mechanicalState["Differential Fluid Level"] || "OK",
          fluidLeakage: mechanicalState["Fluid Leakages"] || "NO LEAKAGE",
          gearbox: mechanicalState["Steering Gearbox & Linkage"] || "OK",
          axle: mechanicalState["Driveline / Axle"] || "OK",
          engineNoise: mechanicalState["Engine / Motor Noise"] || "NORMAL",
        },
        tyreDetails: {
          frontLeftBrand: tyreState.frontLeft.brand,
          frontLeftTread: tyreState.frontLeft.condition,
          frontLeftYear: 2020,
          frontRightBrand: tyreState.frontRight.brand,
          frontRightTread: tyreState.frontRight.condition,
          frontRightYear: 2020,
          rearLeftBrand: tyreState.rearLeft.brand,
          rearLeftTread: tyreState.rearLeft.condition,
          rearLeftYear: 2020,
          rearRightBrand: tyreState.rearRight.brand,
          rearRightTread: tyreState.rearRight.condition,
          rearRightYear: 2020,
          spareBrand: tyreState.spareWheel.brand,
          spareTread: tyreState.spareWheel.condition,
          spareYear: 2020,
          hasJack: emergencyState["Jack"] ?? false,
          hasHandle: emergencyState["Handle"] ?? false,
          hasToolkit: emergencyState["Tool Kit"] ?? false,
          hasTriangle: emergencyState["Emergency Triangle"] ?? false,
          hasFirstAidBox: emergencyState["First Aid Box"] ?? false,
        },
        interiorDetails: {
          batteryBrand: electricalState["Battery Company"] || "",
          batterySerialNumber: electricalState["Full Battery Number"] || "",
          acCooling: electricalState["AC"] || "",
          evaluatorValuation: parseFloat(suggestedPrice.replace(/,/g, "")) || 0,
          rightTailLamp:
            electricalState["Right Side Tail Lamp"] || "OK / WORKING",
          leftTailLamp:
            electricalState["Left Side Tail Lamp"] || "OK / WORKING",
          rightHeadLamp:
            electricalState["Right Side Head Light"] || "OK / WORKING",
          leftHeadLamp:
            electricalState["Left Side Head Light"] || "OK / WORKING",
          indicators: electricalState["Right Indicator"] || "OK / WORKING",
          bootFloor: electricalState["Boot Floor"] || "OK / WORKING",
          dashboard: electricalState["Dashboard"] || "OK / WORKING",
          fogLamps: electricalState["Left Side Fog Lamp"] || "OK / WORKING",
          powerWindows:
            electricalState["Power Window All Buttons"] || "OK / WORKING",
          musicSystem: electricalState["Music System"] || "OK / WORKING",
          steeringMountedControls:
            electricalState["Steering Mounted Controls"] || "OK / WORKING",
          wiper: electricalState["Wiper Washer Front"] || "OK / WORKING",
          rearDefogger: electricalState["Rear Defogger"] || "OK / WORKING",
          rearWasher: electricalState["Rear Wiper Washer"] || "OK / WORKING",
          instrumentCluster:
            electricalState["Instrument Cluster"] || "OK / WORKING",
          infotainment:
            electricalState["Infotainment System"] || "OK / WORKING",
          centralLock: electricalState["Central Lock"] || "OK / WORKING",
          pushButton: electricalState["Push Start Button"] || "OK / WORKING",
          sunroof: electricalState["Sunroof"] || "OK / WORKING",
          sensors: electricalState["All Sensors"] || "OK / WORKING",
          remarks: comments,
        },
        exteriorRating: exteriorRating,
        mechanicalRating: mechanicalRating,
        tyreRating: tyreRating,
        interiorRating: electricalRating,
      };

      let res;
      if (inspectionId) {
        res = await updateInspectionDraft(inspectionId, payload);
      } else {
        res = await saveInspectionDraft(payload);
      }

      if (res.success && res.data) {
        const details = res.data;
        const newId = details.inspectionId || details.id;
        if (newId && newId !== inspectionId) {
          setInspectionId(newId);
          // Set query parameter in URL to avoid duplicate creation
          const newUrl = `${window.location.pathname}?id=${newId}`;
          window.history.pushState({ path: newUrl }, "", newUrl);
        }
        if (showToast) {
          toast.success("Draft saved successfully to server.");
        }
        return res;
      }
    } catch (err: any) {
      console.error("Autosave draft failed", err);
      toast.error(err.response?.data?.message || "Failed to save draft.");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (key: string, file: File) => {
    const category = slotToCategoryMap[key] || key;
    if (category === "Engine / Motor Noise") {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)$/i.test(file.name);
      if (!isVideo) {
        toast.error("Invalid file format. Please upload a video file for Engine / Motor Noise.");
        return;
      }
    } else {
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|heic|bmp|tiff)$/i.test(file.name);
      if (!isImage) {
        toast.error("Invalid file format. Please upload an image file.");
        return;
      }
    }

    let currentId = inspectionId;
    if (!currentId) {
      // Create draft first
      if (!basicDetails.regNo) {
        toast.error(
          "Please enter the vehicle registration number first before uploading photos.",
        );
        return;
      }
      try {
        const res = await saveDraftApiCall(false);
        if (res && res.data) {
          currentId = res.data.inspectionId || res.data.id;
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to initialize draft for image upload.");
        return;
      }
    }

    if (!currentId) return;

    try {
      toast.info(`Uploading media for ${category}...`);
      const res = await uploadInspectionImage(currentId, category, file);
      if (res.success && res.data) {
        setSlotImg(key, res.data);
        toast.success(`Image uploaded for ${category}!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload image.");
    }
  };

  const handleFinalSubmit = async () => {
    if (!inspectionId) {
      toast.error("No active draft found. Please fill vehicle specs first.");
      return;
    }

    // Validate all required steps and images
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        setStep(i);
        toast.error(`Please complete all required fields and image uploads in Step ${i + 1}: ${steps[i].title}.`);
        return;
      }
    }

    try {
      // Save draft once final time
      await saveDraftApiCall(false);
      toast.info("Submitting inspection report to administrator...");

      const res = await submitInspectionReport(inspectionId);
      if (res.success) {
        toast.success("Inspection submitted successfully! Redirecting...");
        navigate("/inspector/vehicles");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        "Submission failed. Ensure all mandatory images and sections are completed.",
      );
    }
  };

  const setBasic = (k: string, v: string) => {
    setBasicDetails((p) => ({ ...p, [k]: v }));
    if (errors[k]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[k];
        return copy;
      });
    }
  };
  const setExt = (panel: string, status: string) =>
    setExteriorState((p) => ({ ...p, [panel]: status }));
  const setMech = (item: string, val: string) =>
    setMechanicalState((p) => ({ ...p, [item]: val }));
  const setEmerg = (item: string, val: boolean) =>
    setEmergencyState((p) => ({ ...p, [item]: val }));
  const setElec = (item: string, val: string) => {
    setElectricalState((p) => ({ ...p, [item]: val }));
    if (errors[item]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[item];
        return copy;
      });
    }
  };
  const setSlotImg = (key: string, url: string) => {
    setPartImages((p) => ({ ...p, [key]: url }));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };
  const removeSlotImg = (key: string) =>
    setPartImages((p) => {
      const copy = { ...p };
      delete copy[key];
      return copy;
    });
  const handleSuggestedPriceChange = (val: string) => {
    // Block alphabetic & special characters - allow only digits and single optional decimal point
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    let formattedVal = parts[0];
    if (parts.length > 1) {
      formattedVal += "." + parts.slice(1).join("");
    }

    setSuggestedPrice(formattedVal);
    if (errors.suggestedPrice) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.suggestedPrice;
        return copy;
      });
    }
  };

  return (
    <AppShell
      role="inspector"
      nav={inspectorNav}
      title="Perform Evaluation"
      breadcrumb={["Inspector", "Perform Evaluation"]}
    >
      <input
        type="file"
        ref={panelFileRef}
        onChange={(e) => handlePanelImageChange(e.target.files)}
        accept="image/*"
        className="hidden"
      />
      {/* Step Indicator Header */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
            200-Point Inspection Wizard
          </h2>
          <span className="rounded-full bg-[#FFC700]/15 px-3.5 py-1.5 text-xs font-extrabold text-[#FFC700] border border-[#FFC700]/30 shadow-sm">
            Step {step + 1} of {steps.length}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
          {steps.map((s, idx) => {
            const active = step === idx;
            const done = idx < step;
            return (
              <button
                key={s.title}
                onClick={() => {
                  if (idx < step) {
                    setStep(idx);
                    setShowPdfPreview(false);
                  } else if (idx > step) {
                    for (let i = step; i < idx; i++) {
                      if (!validateStep(i)) {
                        return;
                      }
                    }
                    setStep(idx);
                    setShowPdfPreview(false);
                  }
                }}
                className={cn(
                  "relative rounded-2xl p-4 text-left border transition-all text-xs cursor-pointer",
                  active
                    ? "border-[#FFC700] bg-[#FFC700]/5 shadow-[0_4px_16px_rgba(255,199,0,0.1)]"
                    : done
                      ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-[#FFC700]/40",
                )}
              >
                {done && (
                  <span className="absolute top-3 right-3 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                  </span>
                )}
                <span
                  className={cn(
                    "block font-extrabold",
                    active ? "text-foreground" : "",
                  )}
                >
                  {s.title}
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground font-semibold leading-normal">
                  {s.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Step 1: Basic specifications */}
          {step === 0 && (
            <Panel
              title="Step 1: Vehicle Specifications"
              description="Capture legal registration certificate and owner profile credentials."
            >
              <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicDetails.customerName}
                    onChange={(e) => setBasic("customerName", e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                      errors.customerName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  />
                  {errors.customerName && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.customerName}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Customer Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={basicDetails.customerMobile}
                    onChange={(e) => {
                      const numeric = e.target.value.replace(/\D/g, "");
                      const cleaned = numeric.replace(/^[0-5]+/, "");
                      setBasic("customerMobile", cleaned.slice(0, 10));
                    }}
                    placeholder="e.g. 9876543210"
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                      errors.customerMobile
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  />
                  {errors.customerMobile && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.customerMobile}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicDetails.regNo}
                    onChange={(e) =>
                      setBasic("regNo", e.target.value.toUpperCase())
                    }
                    placeholder="e.g. MH12LV2376"
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                      errors.regNo
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  />
                  {errors.regNo && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.regNo}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Vehicle Brand / Make <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicDetails.brand}
                    onChange={(e) =>
                      setBasic("brand", e.target.value.toUpperCase())
                    }
                    placeholder="e.g. TOYOTA"
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                      errors.brand
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  />
                  {errors.brand && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.brand}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Model Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicDetails.model}
                    onChange={(e) =>
                      setBasic("model", e.target.value.toUpperCase())
                    }
                    placeholder="e.g. ETIOS LIVA"
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                      errors.model
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  />
                  {errors.model && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.model}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Model Variant <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicDetails.variant}
                    onChange={(e) => setBasic("variant", e.target.value)}
                    placeholder="e.g. Vx"
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                      errors.variant
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  />
                  {errors.variant && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.variant}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Manufacturing Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={basicDetails.year}
                    onChange={(e) => setBasic("year", e.target.value)}
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                      errors.year
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  >
                    <option value="">Select Year</option>
                    {Array.from(
                      { length: 30 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((y) => (
                      <option key={y} value={y.toString()}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {errors.year && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.year}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Fuel Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={basicDetails.fuel}
                    onChange={(e) => setBasic("fuel", e.target.value)}
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                      errors.fuel
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="LPG">LPG</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  {errors.fuel && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.fuel}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Transmission <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={basicDetails.transmission}
                    onChange={(e) => setBasic("transmission", e.target.value)}
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                      errors.transmission
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  >
                    <option value="Manual (MT)">Manual (MT)</option>
                    <option value="Automatic (AT)">Automatic (AT)</option>
                  </select>
                  {errors.transmission && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.transmission}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Odometer Reading (km) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={basicDetails.odometer}
                    onChange={(e) => setBasic("odometer", e.target.value)}
                    placeholder="e.g. 30899"
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                      errors.odometer
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  />
                  {errors.odometer && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.odometer}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Owner Profile Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={basicDetails.ownerName}
                    onChange={(e) => setBasic("ownerName", e.target.value)}
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                      errors.ownerName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  >
                    <option value="1st Owner">1st Owner</option>
                    <option value="2nd Owner">2nd Owner</option>
                    <option value="3rd Owner">3rd Owner</option>
                    <option value="4th Owner">4th Owner</option>
                    <option value="5th Owner or More">5th Owner or More</option>
                  </select>
                  {errors.ownerName && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.ownerName}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Insurance Validity <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={basicDetails.insurance}
                    onChange={(e) => setBasic("insurance", e.target.value)}
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                      errors.insurance
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  >
                    <option value="">Select Insurance Type</option>
                    <option value="Valid (Comprehensive)">
                      Valid (Comprehensive)
                    </option>
                    <option value="Valid (Third Party)">
                      Valid (Third Party)
                    </option>
                    <option value="Expired">Expired</option>
                    <option value="No Insurance">No Insurance</option>
                  </select>
                  {errors.insurance && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.insurance}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={suggestedPrice}
                    onChange={(e) => handleSuggestedPriceChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        !/[0-9.]/.test(e.key) &&
                        !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key) &&
                        !(e.ctrlKey || e.metaKey)
                      ) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="e.g. 350000"
                    className={cn(
                      "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                      errors.suggestedPrice
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                    )}
                  />
                  {errors.suggestedPrice && (
                    <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.suggestedPrice}</span>
                  )}
                </div>
              </div>
            </Panel>
          )}

          {/* Step 2: Exterior panels checklist and photo uploads */}
          {step === 1 && (
            <div className="space-y-8">
              <Panel
                title="Step 2: Exterior Body Checklist"
                description="State condition and paint parameters of exterior sheet metal panels."
                action={
                  <StarRatingInput
                    value={exteriorRating}
                    onChange={setExteriorRating}
                  />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
                  {exteriorPanels.map((panel) => {
                    const value = exteriorState[panel] ?? "OK";
                    const hasImg = !!panelImages[panel];
                    const errorMsg = errors[panel];
                    return (
                      <div
                        key={panel}
                        className={cn(
                          "rounded-2xl border p-3.5 shadow-soft transition-all duration-200",
                          errorMsg
                            ? "border-red-500 bg-red-50/5 hover:border-red-500"
                            : "border-border bg-card hover:border-[#FFC700]/60",
                          hasImg
                            ? "flex flex-col gap-3"
                            : "flex flex-col gap-2 justify-between",
                        )}
                      >
                        {hasImg ? (
                          <>
                            {/* Top Info Row */}
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-extrabold text-foreground truncate min-w-0">
                                {panel} <span className="text-rose-500">*</span>
                              </span>
                              <select
                                value={value}
                                onChange={(e) => setExt(panel, e.target.value)}
                                className="rounded-xl border border-border bg-secondary px-2.5 py-1.5 text-xs font-black outline-none cursor-pointer"
                              >
                                <option value="OK">OK</option>
                                <option value="DAMAGED">DAMAGED</option>
                                <option value="REPAINTED">REPAINTED</option>
                                <option value="CHANGED">CHANGED</option>
                                <option value="SCRATCH">SCRATCH</option>
                                <option value="DENT">DENT</option>
                                <option value="RUST">RUST</option>
                                <option value="NA">NA</option>
                              </select>
                            </div>

                            {/* Large Image Preview Card */}
                            <div className="relative group w-full aspect-[16/10] rounded-xl overflow-hidden border border-border bg-secondary cursor-pointer shadow-inner">
                              <img
                                src={panelImages[panel]}
                                alt={panel}
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-102"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(panelImages[panel], "_blank")
                                  }
                                  className="grid size-8 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-md hover:bg-white/40 cursor-pointer"
                                  title="View Fullscreen"
                                >
                                  <Eye className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPanelImages((prev) => {
                                      const copy = { ...prev };
                                      delete copy[panel];
                                      return copy;
                                    });
                                  }}
                                  className="grid size-8 place-items-center rounded-xl bg-rose-600/80 text-white backdrop-blur-md hover:bg-rose-600 cursor-pointer"
                                  title="Remove Photo"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-bold text-foreground truncate min-w-0">
                                {panel} <span className="text-rose-500">*</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <select
                                  value={value}
                                  onChange={(e) => setExt(panel, e.target.value)}
                                  className="rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold outline-none cursor-pointer"
                                >
                                  <option value="OK">OK</option>
                                  <option value="DAMAGED">DAMAGED</option>
                                  <option value="REPAINTED">REPAINTED</option>
                                  <option value="CHANGED">CHANGED</option>
                                  <option value="SCRATCH">SCRATCH</option>
                                  <option value="DENT">DENT</option>
                                  <option value="RUST">RUST</option>
                                  <option value="NA">NA</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => triggerPanelImageUpload(panel)}
                                  className={cn(
                                    "size-9 rounded-full border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center",
                                    errorMsg
                                      ? "border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                                      : "border-border hover:border-[#FFC700] hover:bg-[#FFC700]/10 text-muted-foreground hover:text-[#FFC700]"
                                  )}
                                  title="Upload Panel Photo"
                                >
                                  <Camera className="size-3.5" />
                                </button>
                              </div>
                            </div>
                            {errorMsg && (
                              <span className="text-[10px] font-bold text-red-500 px-1 animate-fade-in">
                                {errorMsg}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel
                title="Mandatory Exterior Images"
                description="Upload clean, high-resolution photos of five primary panels."
              >
                <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                  {imageSlotsConfig
                    .filter((slot) => slot.step === 1)
                    .map((slot) => (
                      <ImageSlotUploader
                        key={slot.key}
                        label={slot.label}
                        value={partImages[slot.key]}
                        onChange={(file) => handleImageUpload(slot.key, file)}
                        onRemove={() => removeSlotImg(slot.key)}
                        error={errors[slot.key]}
                      />
                    ))}
                </div>
              </Panel>
            </div>
          )}

          {/* Step 3: Mechanical Checklist */}
          {step === 2 && (
            <div className="space-y-8">
              <Panel
                title="Step 3: Mechanical Health Diagnostics"
                description="Check items inside engine compartment, transmission bay and brake assemblies."
                action={
                  <StarRatingInput
                    value={mechanicalRating}
                    onChange={setMechanicalRating}
                  />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mechanicalItems.map((item) => {
                    const value =
                      mechanicalState[item.name] ??
                      (item.type === "fluid"
                        ? item.options?.[0]
                        : (item.default ?? "OK"));
                    const hasImg = !!panelImages[item.name];
                    const errorMsg = errors[item.name];
                    return (
                      <div
                        key={item.name}
                        className={cn(
                          "rounded-2xl border p-3.5 shadow-soft transition-all duration-200",
                          errorMsg
                            ? "border-red-500 bg-red-50/5 hover:border-red-500"
                            : "border-border bg-card hover:border-[#FFC700]/60",
                          hasImg
                            ? "flex flex-col gap-3"
                            : "flex flex-col gap-2 justify-between",
                        )}
                      >
                        {hasImg ? (
                          <>
                            {/* Top Info Row */}
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-bold text-foreground truncate min-w-0">
                                {item.name} <span className="text-rose-500">*</span>
                              </span>
                              {item.type === "fluid" ? (
                                <select
                                  value={value}
                                  onChange={(e) => setMech(item.name, e.target.value)}
                                  className="rounded-xl border border-border bg-secondary px-2.5 py-1.5 text-xs font-extrabold outline-none cursor-pointer"
                                >
                                  {item.options?.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : item.type === "text" ? (
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => setMech(item.name, e.target.value)}
                                  className="max-w-[120px] rounded-xl border border-border bg-secondary px-2.5 py-1.5 text-xs font-extrabold outline-none text-right"
                                />
                              ) : (
                                <select
                                  value={value}
                                  onChange={(e) => setMech(item.name, e.target.value)}
                                  className="rounded-xl border border-border bg-secondary px-2.5 py-1.5 text-xs font-extrabold outline-none cursor-pointer"
                                >
                                  <option value="OK">OK</option>
                                  <option value="NOT OK">NOT OK</option>
                                </select>
                              )}
                            </div>

                            {/* Large Image / Video Preview Card */}
                            <div className="relative group w-full aspect-[16/10] rounded-xl overflow-hidden border border-border bg-black cursor-pointer shadow-inner">
                              {item.name === "Engine / Motor Noise" || panelImages[item.name]?.startsWith("data:video") || panelImages[item.name]?.includes(".mp4") || panelImages[item.name]?.includes(".webm") || panelImages[item.name]?.includes(".mov") || panelImages[item.name]?.includes(".avi") || panelImages[item.name]?.includes("video") ? (
                                <video
                                  src={panelImages[item.name]}
                                  controls
                                  preload="metadata"
                                  playsInline
                                  className="size-full object-cover rounded-xl"
                                >
                                  <source src={panelImages[item.name]} type="video/mp4" />
                                </video>
                              ) : (
                                <img
                                  src={panelImages[item.name]}
                                  alt={item.name}
                                  className="size-full object-cover transition-transform duration-300 group-hover:scale-102"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(panelImages[item.name], "_blank")
                                  }
                                  className="grid size-8 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-md hover:bg-white/40 cursor-pointer pointer-events-auto"
                                  title="View Fullscreen"
                                >
                                  <Eye className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPanelImages((prev) => {
                                      const copy = { ...prev };
                                      delete copy[item.name];
                                      return copy;
                                    });
                                  }}
                                  className="grid size-8 place-items-center rounded-xl bg-rose-600/80 text-white backdrop-blur-md hover:bg-rose-600 cursor-pointer pointer-events-auto"
                                  title="Remove Photo"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-bold text-foreground truncate min-w-0">
                                {item.name} <span className="text-rose-500">*</span>
                              </span>
                              <div className="flex items-center gap-2">
                                {item.type === "fluid" ? (
                                  <select
                                    value={value}
                                    onChange={(e) => setMech(item.name, e.target.value)}
                                    className="rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold outline-none cursor-pointer"
                                  >
                                    {item.options?.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : item.type === "text" ? (
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setMech(item.name, e.target.value)}
                                    className="max-w-[120px] rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold outline-none text-right"
                                  />
                                ) : (
                                  <select
                                    value={value}
                                    onChange={(e) => setMech(item.name, e.target.value)}
                                    className="rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold outline-none cursor-pointer"
                                  >
                                    <option value="OK">OK</option>
                                    <option value="NOT OK">NOT OK</option>
                                  </select>
                                )}

                                <button
                                  type="button"
                                  onClick={() => triggerPanelImageUpload(item.name)}
                                  className={cn(
                                    "size-9 rounded-full border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center",
                                    errorMsg
                                      ? "border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                                      : "border-border hover:border-[#FFC700] hover:bg-[#FFC700]/10 text-muted-foreground hover:text-[#FFC700]"
                                  )}
                                  title={item.name === "Engine / Motor Noise" ? "Upload Video" : "Upload Photo"}
                                >
                                  {item.name === "Engine / Motor Noise" ? (
                                    <Video className="size-3.5" />
                                  ) : (
                                    <Camera className="size-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            {errorMsg && (
                              <span className="text-[10px] font-bold text-red-500 px-1 animate-fade-in">
                                {errorMsg}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel
                title="Under-Bonnet Engine Room Photos"
                description="Clear views of motor cylinders, fluid caps, and battery mounts."
              >
                <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                  {imageSlotsConfig
                    .filter((slot) => slot.step === 2)
                    .map((slot) => (
                      <ImageSlotUploader
                        key={slot.key}
                        label={slot.label}
                        value={partImages[slot.key]}
                        onChange={(file) => handleImageUpload(slot.key, file)}
                        onRemove={() => removeSlotImg(slot.key)}
                        error={errors[slot.key]}
                      />
                    ))}
                </div>
              </Panel>
            </div>
          )}

          {/* Step 4: Tyre tread & emergency toolkit */}
          {step === 3 && (
            <div className="space-y-8">
              <Panel
                title="Step 4: Tyres Specifications"
                description="Enter remaining tread depth percentage and brand names for all wheels."
                action={
                  <StarRatingInput
                    value={tyreRating}
                    onChange={setTyreRating}
                  />
                }
              >
                <div className="grid gap-5 md:grid-cols-2">
                  {tyrePositions.map((pos) => {
                    const tyre = tyreState[pos.id] || {
                      condition: 60,
                      brand: "JK 2019",
                    };
                    return (
                      <div
                        key={pos.id}
                        className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col gap-4"
                      >
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                          <p className="text-sm font-extrabold text-foreground">
                            {pos.label} <span className="text-rose-500">*</span>
                          </p>
                          <span className="text-xs font-extrabold text-[#FFC700] bg-[#FFC700]/10 px-2.5 py-0.5 rounded-full border border-[#FFC700]/25">
                            {tyre.condition}% Remaining
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                              Tread Depth (0-100%) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={tyre.condition}
                              onChange={(e) =>
                                setTyreState((p) => ({
                                  ...p,
                                  [pos.id]: {
                                    ...tyre,
                                    condition: parseInt(e.target.value),
                                  },
                                }))
                              }
                              className="w-full accent-[#FFC700]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                              Tyre Brand & Batch Code <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={tyre.brand}
                              onChange={(e) =>
                                setTyreState((p) => ({
                                  ...p,
                                  [pos.id]: { ...tyre, brand: e.target.value },
                                }))
                              }
                              className="w-full rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-extrabold text-foreground outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel
                title="Emergency Toolkit Checklist"
                description="Mark available emergency supplies and tools found inside boot drawer."
              >
                <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                  {emergencyItems.map((item) => {
                    const checked = emergencyState[item] ?? false;
                    return (
                      <label
                        key={item}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border bg-card p-4 shadow-soft cursor-pointer transition-all hover:border-[#FFC700]/60",
                          checked
                            ? "border-[#FFC700] bg-[#FFC700]/5"
                            : "border-border",
                        )}
                      >
                        <span className="text-xs font-extrabold text-foreground">
                          {item} <span className="text-rose-500">*</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setEmerg(item, e.target.checked)}
                          className="size-4.5 rounded border-border accent-[#FFC700]"
                        />
                      </label>
                    );
                  })}
                </div>
              </Panel>

              <Panel
                title="Individual Tyre Profile Images"
                description="Upload tread close-ups for all 4 positions and spare wheel."
              >
                <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                  {imageSlotsConfig
                    .filter((slot) => slot.step === 3)
                    .map((slot) => (
                      <ImageSlotUploader
                        key={slot.key}
                        label={slot.label}
                        value={partImages[slot.key]}
                        onChange={(file) => handleImageUpload(slot.key, file)}
                        onRemove={() => removeSlotImg(slot.key)}
                        error={errors[slot.key]}
                      />
                    ))}
                </div>
              </Panel>
            </div>
          )}

          {/* Step 5: Interior diagnostics and final comments */}
          {step === 4 && (
            <div className="space-y-8">
              <Panel
                title="Cabin & Electrical Components"
                description="Upload odometer and AC control photo slots."
              >
                <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                  {imageSlotsConfig
                    .filter((slot) => slot.step === 4)
                    .map((slot) => (
                      <ImageSlotUploader
                        key={slot.key}
                        label={slot.label}
                        value={partImages[slot.key]}
                        onChange={(file) => handleImageUpload(slot.key, file)}
                        onRemove={() => removeSlotImg(slot.key)}
                        error={errors[slot.key]}
                      />
                    ))}
                </div>
              </Panel>

              <Panel
                title="Interior & Electrical Diagnostics"
                description="Parameters from Electrical & Interior Report."
                action={
                  <StarRatingInput
                    value={electricalRating}
                    onChange={setElectricalRating}
                  />
                }
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Battery Brand <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={electricalState["Battery Company"]}
                      onChange={(e) =>
                        setElec("Battery Company", e.target.value)
                      }
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors["Battery Company"]
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                      )}
                    />
                    {errors["Battery Company"] && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors["Battery Company"]}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Battery Serial No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={electricalState["Full Battery Number"]}
                      onChange={(e) =>
                        setElec("Full Battery Number", e.target.value)
                      }
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors["Full Battery Number"]
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                      )}
                    />
                    {errors["Full Battery Number"] && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors["Full Battery Number"]}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      AC Cooling Performance <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={electricalState["AC"]}
                      onChange={(e) => setElec("AC", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors["AC"]
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30",
                      )}
                    />
                    {errors["AC"] && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors["AC"]}</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
                  {electricalItems.map((item) => {
                    const status = electricalState[item] ?? "OK / WORKING";
                    const hasImg = !!panelImages[item];
                    const errorMsg = errors[item];
                    return (
                      <div
                        key={item}
                        className={cn(
                          "rounded-2xl border p-3.5 shadow-soft transition-all duration-200",
                          errorMsg
                            ? "border-red-500 bg-red-50/5 hover:border-red-500"
                            : "border-border bg-card hover:border-[#FFC700]/60",
                          hasImg
                            ? "flex flex-col gap-3"
                            : "flex flex-col gap-2 justify-between",
                        )}
                      >
                        {hasImg ? (
                          <>
                            {/* Top Info Row */}
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-bold text-foreground truncate min-w-0">
                                {item} <span className="text-rose-500">*</span>
                              </span>
                              <select
                                value={status}
                                onChange={(e) => setElec(item, e.target.value)}
                                className="rounded-xl border border-border bg-secondary px-2.5 py-1.5 text-xs font-black outline-none cursor-pointer"
                              >
                                <option value="OK / WORKING">
                                  OK / WORKING
                                </option>
                                <option value="NOT WORKING">NOT WORKING</option>
                                <option value="N/A">N/A</option>
                              </select>
                            </div>

                            {/* Large Image Preview Card */}
                            <div className="relative group w-full aspect-[16/10] rounded-xl overflow-hidden border border-border bg-secondary cursor-pointer shadow-inner">
                              <img
                                src={panelImages[item]}
                                alt={item}
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-102"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(panelImages[item], "_blank")
                                  }
                                  className="grid size-8 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-md hover:bg-white/40 cursor-pointer"
                                  title="View Fullscreen"
                                >
                                  <Eye className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPanelImages((prev) => {
                                      const copy = { ...prev };
                                      delete copy[item];
                                      return copy;
                                    });
                                  }}
                                  className="grid size-8 place-items-center rounded-xl bg-rose-600/80 text-white backdrop-blur-md hover:bg-rose-600 cursor-pointer"
                                  title="Remove Photo"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-bold text-foreground truncate min-w-0">
                                {item} <span className="text-rose-500">*</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <select
                                  value={status}
                                  onChange={(e) => setElec(item, e.target.value)}
                                  className="rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold outline-none cursor-pointer"
                                >
                                  <option value="OK / WORKING">
                                    OK / WORKING
                                  </option>
                                  <option value="NOT WORKING">NOT WORKING</option>
                                  <option value="N/A">N/A</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => triggerPanelImageUpload(item)}
                                  className={cn(
                                    "size-9 rounded-full border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center",
                                    errorMsg
                                      ? "border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                                      : "border-border hover:border-[#FFC700] hover:bg-[#FFC700]/10 text-muted-foreground hover:text-[#FFC700]"
                                  )}
                                  title="Upload Panel Photo"
                                >
                                  <Camera className="size-4" />
                                </button>
                              </div>
                            </div>
                            {errorMsg && (
                              <span className="text-[10px] font-bold text-red-500 px-1 animate-fade-in">
                                {errorMsg}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <div>
                    <label className="block text-xs font-extrabold text-foreground mb-1.5">
                      Inspector Remarks & Notes
                    </label>
                    <textarea
                      rows={4}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground outline-none transition-all hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-2 focus:ring-[#FFC700]/30 shadow-soft"
                    />
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </>
      )}

      {/* Form Action Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-t border-border pt-6">
        <button
          onClick={() => {
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={step === 0}
          className="rounded-2xl border border-border bg-card px-6 py-3 text-xs font-extrabold shadow-soft transition-all hover:bg-secondary disabled:opacity-40 cursor-pointer"
        >
          Previous Step
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => saveDraftApiCall(true)}
            disabled={saving}
            className="rounded-2xl border border-border bg-card px-6 py-3 text-xs font-extrabold shadow-soft transition-all hover:border-[#FFC700]/60 hover:bg-secondary disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Autosaving..." : "Save Draft"}
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={async () => {
                if (!validateStep(step)) {
                  return;
                }
                try {
                  await saveDraftApiCall(false);
                  setStep((s) => s + 1);
                } catch (err) { }
              }}
              className="flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.35)] transition-all cursor-pointer"
            >
              Continue Next Step <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              className="flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,199,0,0.55)] cursor-pointer"
            >
              <ShieldCheck className="size-4" /> Submit Report to Admin
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
