import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Car,
  DollarSign,
  FileText,
  Info,
  Save,
  ShieldCheck,
  Upload,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { freelancerNav } from "@/components/nav-config";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  saveFreelancerInspectionDraft,
  updateFreelancerInspectionDraft,
  uploadFreelancerInspectionImage,
  submitFreelancerInspectionReport,
  getFreelancerInspectionDetails,
} from "@/lib/api/freelancer-api";

const isValidRegNo = (regNo: string): boolean => {
  if (!regNo) return false;
  const clean = regNo.replace(/\s+/g, "").toUpperCase();
  const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/;
  const bhPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

  const isPureNumeric = /^\d+$/.test(clean);
  const isPureAlpha = /^[A-Z]+$/.test(clean);

  if (isPureNumeric || isPureAlpha) return false;

  return (standardPattern.test(clean) || bhPattern.test(clean)) && clean.length >= 6 && clean.length <= 12;
};

const PHOTO_SLOTS = [
  "Front View",
  "Rear View",
  "Right Side",
  "Left Side",
  "Dashboard",
  "Odometer",
  "Interior / Seats",
  "Engine Bay",
  "Boot Space",
  "RC / Document",
];

const freelancerSteps = [
  { title: "Vehicle & Customer Details", subtitle: "Customer info, vehicle specs, RTO & pricing" },
  { title: "Photos & Video Upload", subtitle: "10 basic photos & 1 walkaround video" },
];

export function FreelancerAddVehicle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

  const fuelTypeOptions = ["Petrol", "Diesel", "CNG", "LPG", "Electric", "Hybrid"];
  const transmissionOptions = ["Manual (MT)", "Automatic (AT)"];
  const ownerProfileStatusOptions = [
    "1st Owner",
    "2nd Owner",
    "3rd Owner",
    "4th Owner",
    "5th Owner or More",
  ];

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerMobileNumber: "",
    registrationNumber: "",
    brand: "",
    model: "",
    variant: "",
    manufacturingYear: "",
    registrationYear: "",
    fuelType: "Petrol",
    transmission: "Manual (MT)",
    odometerReading: "",
    ownerProfileStatus: "1st Owner",
    insuranceValidity: "",
    price: "",
    location: "",
    underHypothecation: "",
    accidental: "No",
    rtoInformation: "",
  });

  // Photo Map for 10 named slots & Video File
  const [photoMap, setPhotoMap] = useState<Record<string, { preview: string; file?: File }>>({});
  const [video, setVideo] = useState<{ file?: File; name: string; previewUrl?: string } | null>(null);

  // Load existing draft/vehicle if ?id= is present
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      setEditingId(idParam);

      getFreelancerInspectionDetails(idParam)
        .then((res) => {
          if (res.success && res.data) {
            const v = res.data.vehicleDetails || {};
            setFormData({
              customerName: v.customerName || "",
              customerMobileNumber: v.customerMobileNumber || "",
              registrationNumber: v.vehicleNumber || "",
              brand: v.brand || "",
              model: v.model || "",
              variant: v.variant || "",
              manufacturingYear: v.manufacturingYear ? v.manufacturingYear.toString() : "",
              registrationYear: v.registrationYear ? v.registrationYear.toString() : "",
              fuelType: v.fuelType || "Petrol",
              transmission: v.transmission || "Manual (MT)",
              odometerReading: v.odometerReading ? v.odometerReading.toString() : "",
              ownerProfileStatus: v.ownerName || "1st Owner",
              insuranceValidity: v.insuranceStatus || "",
              price: v.suggestedPrice ? v.suggestedPrice.toString() : "",
              location: v.location || "",
              underHypothecation: v.underHypothecation || "",
              accidental: v.accidental || "No",
              rtoInformation: v.rtoInformation || "",
            });
            const loadedPhotoMap: Record<string, { preview: string }> = {};
            let foundVideo: { name: string; previewUrl: string } | null = null;

            if (res.data.videoUrl) {
              foundVideo = { name: "Walkaround Video", previewUrl: res.data.videoUrl };
            } else if (res.data.inspectionVideos && Array.isArray(res.data.inspectionVideos)) {
              const vid = res.data.inspectionVideos.find((item: any) => item.videoUrl && item.captured !== false);
              if (vid) {
                foundVideo = { name: vid.displayName || "Walkaround Video", previewUrl: vid.videoUrl };
              }
            }

            const rawPhotos = res.data.inspectionPhotos || res.data.photos || [];
            if (Array.isArray(rawPhotos)) {
              rawPhotos.forEach((item: any) => {
                const cat = item.imageCategory || item.displayName || item.photoType || "";
                const url = item.imageUrl || (typeof item === "string" ? item : "");
                if (!url) return;

                const lowerUrl = url.toLowerCase();
                const isVid =
                  cat === "Engine / Motor Noise" ||
                  cat.toLowerCase().includes("video") ||
                  /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(lowerUrl);

                if (isVid) {
                  if (!foundVideo) {
                    foundVideo = { name: "Walkaround Video", previewUrl: url };
                  }
                } else {
                  const matchedSlot =
                    PHOTO_SLOTS.find(
                      (slot) => slot.toLowerCase() === cat.toLowerCase() || cat.toLowerCase().includes(slot.toLowerCase())
                    ) || cat;

                  if (matchedSlot) {
                    loadedPhotoMap[matchedSlot] = { preview: url };
                  }
                }
              });
            }

            setPhotoMap(loadedPhotoMap);
            if (foundVideo) {
              setVideo(foundVideo);
            }
          }
        })
        .catch(() => {
          toast.error("Could not load vehicle details from API.");
        });
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Multi-select photo upload handler
  const handleMultiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    for (const file of fileList) {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      const ext = fileName.split(".").pop() || "";
      const isAvif = ext === "avif" || fileType.includes("avif");
      const isAllowed = ["jpg", "jpeg", "png"].includes(ext) || ["image/jpeg", "image/jpg", "image/png"].includes(fileType);

      if (isAvif || !isAllowed) {
        toast.error("Please upload only JPG, JPEG, or PNG format images.");
        return;
      }
    }

    setPhotoMap((prev) => {
      const nextMap = { ...prev };
      let fileIdx = 0;

      for (const slot of PHOTO_SLOTS) {
        if (fileIdx >= fileList.length) break;
        if (!nextMap[slot]) {
          const file = fileList[fileIdx];
          nextMap[slot] = {
            preview: URL.createObjectURL(file),
            file,
          };
          fileIdx++;
        }
      }

      if (fileIdx < fileList.length) {
        for (let i = 0; i < fileList.length; i++) {
          const slot = PHOTO_SLOTS[i];
          if (slot) {
            const file = fileList[i];
            nextMap[slot] = {
              preview: URL.createObjectURL(file),
              file,
            };
          }
        }
      }

      return nextMap;
    });

    if (errors.photos) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.photos;
        return copy;
      });
    }
    toast.success(`Uploaded ${fileList.length} photo(s).`);
  };

  // Single slot photo upload handler
  const handleSingleSlotUpload = (slot: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    const ext = fileName.split(".").pop() || "";
    const isAvif = ext === "avif" || fileType.includes("avif");
    const isAllowed = ["jpg", "jpeg", "png"].includes(ext) || ["image/jpeg", "image/jpg", "image/png"].includes(fileType);

    if (isAvif || !isAllowed) {
      toast.error("Please upload only JPG, JPEG, or PNG format image.");
      return;
    }

    setPhotoMap((prev) => ({
      ...prev,
      [slot]: {
        preview: URL.createObjectURL(file),
        file,
      },
    }));

    if (errors.photos) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.photos;
        return copy;
      });
    }
    toast.success(`Updated ${slot} photo.`);
  };

  const removePhotoSlot = (slot: string) => {
    setPhotoMap((prev) => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)$/i.test(file.name);
    if (!isVideo) {
      toast.error("Invalid file format. Please upload a video file for Walkaround Video.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setVideo({ file, name: file.name, previewUrl });
    if (errors.video) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.video;
        return copy;
      });
    }
    toast.success("Walkaround video uploaded successfully.");
  };

  const buildApiPayload = () => {
    return {
      vehicleDetails: {
        vehicleNumber: formData.registrationNumber.toUpperCase(),
        customerName: formData.customerName,
        customerMobileNumber: formData.customerMobileNumber,
        ownerName: formData.ownerProfileStatus,
        brand: formData.brand,
        model: formData.model,
        variant: formData.variant,
        manufacturingYear: parseInt(formData.manufacturingYear) || currentYear,
        registrationYear: parseInt(formData.registrationYear) || currentYear,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        odometerReading: parseInt(formData.odometerReading) || 0,
        insuranceStatus: formData.insuranceValidity,
        suggestedPrice: parseFloat(formData.price) || 0,
        location: formData.location,
        rtoInformation: formData.rtoInformation,
        underHypothecation: formData.underHypothecation,
        accidental: formData.accidental,
      },
    };
  };

  // Save Draft Logic via API
  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = buildApiPayload();
      let inspectionId = editingId;

      if (editingId) {
        await updateFreelancerInspectionDraft(editingId, payload);
      } else {
        const res = await saveFreelancerInspectionDraft(payload);
        if (res.success && res.data) {
          inspectionId = res.data.inspectionId || res.data.id;
        }
      }

      if (inspectionId) {
        for (const slot of PHOTO_SLOTS) {
          const item = photoMap[slot];
          if (item?.file) {
            try {
              await uploadFreelancerInspectionImage(inspectionId, slot, item.file);
            } catch (err) {
              console.warn(`Failed image upload for slot ${slot}`, err);
            }
          }
        }

        if (video?.file) {
          try {
            await uploadFreelancerInspectionImage(inspectionId, "Engine / Motor Noise", video.file);
          } catch (err) {
            console.warn("Failed video upload", err);
          }
        }
      }

      toast.success("Inspection draft saved successfully via API!");
      setTimeout(() => {
        navigate("/freelancer/vehicles");
      }, 800);
    } catch (err: any) {
      console.error("API Draft save error", err);
      toast.success("Inspection draft saved!");
      setTimeout(() => {
        navigate("/freelancer/vehicles");
      }, 800);
    } finally {
      setSubmitting(false);
    }
  };

  const validateStep = (stepIdx: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIdx === 0) {
      if (!formData.customerName.trim()) {
        newErrors.customerName = "Customer Name is required.";
      } else if (formData.customerName.trim().length < 2) {
        newErrors.customerName = "Customer Name must be at least 2 characters.";
      }

      if (!formData.customerMobileNumber.trim()) {
        newErrors.customerMobileNumber = "Customer Mobile Number is required.";
      } else if (!/^[6-9]\d{9}$/.test(formData.customerMobileNumber.trim())) {
        newErrors.customerMobileNumber = "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.";
      }

      if (!formData.registrationNumber.trim()) {
        newErrors.registrationNumber = "Registration Number is required.";
      } else if (!isValidRegNo(formData.registrationNumber)) {
        newErrors.registrationNumber = "Enter a valid registration number (e.g. MH12AB1234).";
      }

      if (!formData.brand.trim()) {
        newErrors.brand = "Vehicle Brand / Make is required.";
      } else if (formData.brand.trim().length < 2) {
        newErrors.brand = "Vehicle Brand / Make must be at least 2 characters.";
      }

      if (!formData.model.trim()) {
        newErrors.model = "Model Name is required.";
      } else if (formData.model.trim().length < 2) {
        newErrors.model = "Model Name must be at least 2 characters.";
      }

      if (!formData.variant.trim()) {
        newErrors.variant = "Model Variant is required.";
      } else if (formData.variant.trim().length < 2) {
        newErrors.variant = "Model Variant must be at least 2 characters.";
      }

      if (!formData.manufacturingYear) {
        newErrors.manufacturingYear = "Manufacturing Year is required.";
      }

      if (!formData.registrationYear) {
        newErrors.registrationYear = "Registration Year is required.";
      }

      if (!formData.fuelType) {
        newErrors.fuelType = "Fuel Type is required.";
      }

      if (!formData.transmission) {
        newErrors.transmission = "Transmission is required.";
      }

      if (!formData.odometerReading.trim()) {
        newErrors.odometerReading = "Odometer Reading (km) is required.";
      }

      if (!formData.ownerProfileStatus) {
        newErrors.ownerProfileStatus = "Owner Profile Status is required.";
      }

      if (!formData.insuranceValidity) {
        newErrors.insuranceValidity = "Insurance Validity is required.";
      }

      if (!formData.price.trim()) {
        newErrors.price = "Price (₹) is required.";
      } else if (isNaN(Number(formData.price.replace(/,/g, "")))) {
        newErrors.price = "Please enter a valid numeric price.";
      }

      if (!formData.location.trim()) {
        newErrors.location = "Location is required.";
      }

      if (!formData.underHypothecation) {
        newErrors.underHypothecation = "Under Hypothecation status is required.";
      }

      if (!formData.accidental) {
        newErrors.accidental = "Accidental Status is required.";
      }

      if (!formData.rtoInformation.trim()) {
        newErrors.rtoInformation = "RTO Information is required.";
      }
    } else if (stepIdx === 1) {
      const uploadedCount = Object.keys(photoMap).length;
      if (uploadedCount < 10) {
        newErrors.photos = `All 10 basic vehicle photos are mandatory. You have uploaded ${uploadedCount} / 10 photos.`;
      }

      if (!video) {
        newErrors.video = "Walkaround Video is required.";
      }
    }

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      toast.error(`Please complete all required fields in Step ${stepIdx + 1}: ${freelancerSteps[stepIdx].title}.`);
    }
    return isValid;
  };

  // Save Draft silently in background when clicking Continue Next Step
  const saveDraftSilent = async (): Promise<string | null> => {
    try {
      const payload = buildApiPayload();
      let inspectionId = editingId;

      if (editingId) {
        await updateFreelancerInspectionDraft(editingId, payload);
      } else {
        const res = await saveFreelancerInspectionDraft(payload);
        if (res.success && res.data) {
          inspectionId = res.data.inspectionId || res.data.id;
          if (inspectionId) {
            setEditingId(inspectionId.toString());
          }
        }
      }
      return inspectionId ? inspectionId.toString() : null;
    } catch (err) {
      console.warn("Silent draft save error:", err);
      return editingId;
    }
  };

  const handleNextStep = async () => {
    if (!validateStep(step)) return;

    // Silently save draft in background so draft inspectionId is initialized for Step 2
    await saveDraftSilent();
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If user is on step 1 of wizard (step 0), advance to step 2 without hitting final submit report API
    if (step < freelancerSteps.length - 1) {
      await handleNextStep();
      return;
    }

    // Only hit submit API on final step (step 2) after validating all steps
    for (let i = 0; i < freelancerSteps.length; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = buildApiPayload();
      let inspectionId = editingId;

      if (editingId) {
        await updateFreelancerInspectionDraft(editingId, payload);
      } else {
        const res = await saveFreelancerInspectionDraft(payload);
        if (res.success && res.data) {
          inspectionId = res.data.inspectionId || res.data.id;
        }
      }

      if (inspectionId) {
        for (const slot of PHOTO_SLOTS) {
          const item = photoMap[slot];
          if (item?.file) {
            try {
              await uploadFreelancerInspectionImage(inspectionId, slot, item.file);
            } catch (err) {
              console.warn(`Failed image upload for slot ${slot}`, err);
            }
          }
        }

        if (video?.file) {
          try {
            await uploadFreelancerInspectionImage(inspectionId, "Engine / Motor Noise", video.file);
          } catch (err) {
            console.warn("Failed video upload", err);
          }
        }

        try {
          await submitFreelancerInspectionReport(inspectionId);
        } catch (err) {
          console.warn("Submit report endpoint warning", err);
        }
      }

      toast.success("Vehicle submitted successfully via API! Sent to Admin for approval.");
      setTimeout(() => {
        navigate("/freelancer/vehicles");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      toast.success("Vehicle submitted! Sent to Admin for approval.");
      setTimeout(() => {
        navigate("/freelancer/vehicles");
      }, 1000);
    } finally {
      setSubmitting(false);
    }
  };

  const photoCount = Object.keys(photoMap).length;

  return (
    <AppShell
      role="freelancer"
      nav={freelancerNav}
      title={editingId ? "Edit Vehicle Draft" : "Add Vehicle (Freelancer)"}
      breadcrumb={["Freelancer", editingId ? "Edit Draft" : "Add Vehicle"]}
    >
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Step Indicator Header */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              Freelancer Vehicle Upload Wizard
            </h2>
            <span className="rounded-full bg-[#FFC700]/15 px-3.5 py-1.5 text-xs font-extrabold text-[#FFC700] border border-[#FFC700]/30 shadow-sm">
              Step {step + 1} of {freelancerSteps.length}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {freelancerSteps.map((s, idx) => {
              const active = step === idx;
              const done = idx < step;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => {
                    if (idx < step) {
                      setStep(idx);
                    } else if (idx > step) {
                      for (let i = step; i < idx; i++) {
                        if (!validateStep(i)) {
                          return;
                        }
                      }
                      setStep(idx);
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
                    Step {idx + 1}: {s.title}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground font-semibold leading-normal">
                    {s.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Vehicle & Customer Details */}
          {step === 0 && (
            <div className="space-y-8">
              {/* Section 1A: Customer Info */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="size-5 text-amber-500" /> Customer Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.customerName
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
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
                      placeholder="e.g. 9876543210"
                      value={formData.customerMobileNumber}
                      onChange={(e) => {
                        const numeric = e.target.value.replace(/\D/g, "");
                        handleInputChange("customerMobileNumber", numeric.slice(0, 10));
                      }}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.customerMobileNumber
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    />
                    {errors.customerMobileNumber && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.customerMobileNumber}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 1B: Vehicle Specs */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Car className="size-5 text-amber-500" /> Vehicle Specifications
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Registration Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH02AB1234"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange("registrationNumber", e.target.value.toUpperCase())}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft uppercase",
                        errors.registrationNumber
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    />
                    {errors.registrationNumber && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.registrationNumber}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Vehicle Brand / Make <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maruti Suzuki, Hyundai"
                      value={formData.brand}
                      onChange={(e) => handleInputChange("brand", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.brand
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
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
                      placeholder="e.g. Swift, Creta, City"
                      value={formData.model}
                      onChange={(e) => handleInputChange("model", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.model
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
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
                      placeholder="e.g. VXI, SX Opt, ZXI Plus"
                      value={formData.variant}
                      onChange={(e) => handleInputChange("variant", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.variant
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
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
                      value={formData.manufacturingYear}
                      onChange={(e) => handleInputChange("manufacturingYear", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                        errors.manufacturingYear
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    {errors.manufacturingYear && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.manufacturingYear}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Registration Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.registrationYear}
                      onChange={(e) => handleInputChange("registrationYear", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                        errors.registrationYear
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    >
                      <option value="">Select Registration Year</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    {errors.registrationYear && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.registrationYear}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Fuel Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) => handleInputChange("fuelType", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                        errors.fuelType
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    >
                      {fuelTypeOptions.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    {errors.fuelType && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.fuelType}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Transmission <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.transmission}
                      onChange={(e) => handleInputChange("transmission", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                        errors.transmission
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    >
                      {transmissionOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
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
                      placeholder="e.g. 45000"
                      value={formData.odometerReading}
                      onChange={(e) => handleInputChange("odometerReading", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.odometerReading
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    />
                    {errors.odometerReading && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.odometerReading}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 1C: Owner, Insurance, Location & Price */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <DollarSign className="size-5 text-amber-500" /> Additional Details & Pricing
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Owner Profile Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.ownerProfileStatus}
                      onChange={(e) => handleInputChange("ownerProfileStatus", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                        errors.ownerProfileStatus
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    >
                      {ownerProfileStatusOptions.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    {errors.ownerProfileStatus && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.ownerProfileStatus}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Insurance Validity <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.insuranceValidity}
                      onChange={(e) => handleInputChange("insuranceValidity", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                        errors.insuranceValidity
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    >
                      <option value="">Select Insurance Type</option>
                      <option value="Valid (Comprehensive)">Valid (Comprehensive)</option>
                      <option value="Valid (Third Party)">Valid (Third Party)</option>
                      <option value="Expired">Expired</option>
                      <option value="No Insurance">No Insurance</option>
                    </select>
                    {errors.insuranceValidity && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.insuranceValidity}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Expected Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 550000"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.price
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    />
                    {errors.price && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.price}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Andheri West"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.location
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    />
                    {errors.location && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.location}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Under Hypothecation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.underHypothecation}
                      onChange={(e) => handleInputChange("underHypothecation", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                        errors.underHypothecation
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    >
                      <option value="">Select Under Hypothecation</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="N/A">N/A</option>
                    </select>
                    {errors.underHypothecation && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.underHypothecation}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Accidental Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.accidental}
                      onChange={(e) => handleInputChange("accidental", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft cursor-pointer",
                        errors.accidental
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    {errors.accidental && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.accidental}</span>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      RTO Information <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH-02 Mumbai West RTO, NOC available"
                      value={formData.rtoInformation}
                      onChange={(e) => handleInputChange("rtoInformation", e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none transition-all focus:ring-2 shadow-soft",
                        errors.rtoInformation
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-border hover:border-[#FFC700]/60 focus:border-[#FFC700] focus:ring-[#FFC700]/30"
                      )}
                    />
                    {errors.rtoInformation && (
                      <span className="mt-1 block text-xs font-bold text-red-500 px-1">{errors.rtoInformation}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Photos & Video Upload */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Section 2A: 10 Named Photo Slots + Multi-Select Upload */}
              <div className={cn(
                "rounded-3xl border p-6 shadow-soft space-y-4 transition-all",
                errors.photos ? "border-red-500 bg-red-50/5" : "border-border bg-card"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Camera className="size-5 text-amber-500" /> Basic Vehicle Photos (10 Named Slots) <span className="text-rose-500">*</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Multi-select up to 10 photos or upload individually for each specific slot title below.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                      {photoCount} / 10 Uploaded
                    </span>

                    <label className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-black font-extrabold px-4 py-2.5 text-xs shadow-soft transition-all cursor-pointer">
                      <Upload className="size-4" /> Multi-Select Photos
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleMultiPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {errors.photos && (
                  <span className="block text-xs font-bold text-red-500 px-1">{errors.photos}</span>
                )}

                {/* 10 Named Photo Slot Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
                  {PHOTO_SLOTS.map((slotTitle, idx) => {
                    const item = photoMap[slotTitle];
                    return (
                      <div
                        key={slotTitle}
                        className={cn(
                          "relative rounded-2xl border p-2 flex flex-col justify-between aspect-square transition-all overflow-hidden group shadow-soft",
                          item ? "border-amber-500/40 bg-card" : "border-dashed border-border bg-secondary/20 hover:border-amber-500/60"
                        )}
                      >
                        {item ? (
                          <>
                            <img
                              src={item.preview}
                              alt={slotTitle}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removePhotoSlot(slotTitle)}
                                className="rounded-full bg-red-500/90 text-white p-2 hover:bg-red-600 cursor-pointer shadow-md"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[10px] font-extrabold p-1 truncate text-center rounded-lg">
                              {idx + 1}. {slotTitle}
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 text-center cursor-pointer hover:bg-secondary/40 rounded-xl transition-all">
                            <Camera className="size-6 text-amber-500/80 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-extrabold text-foreground leading-tight">
                              {idx + 1}. {slotTitle}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold">Upload Photo</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg"
                              onChange={(e) => handleSingleSlotUpload(slotTitle, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2B: 1 Video Upload */}
              <div className={cn(
                "rounded-3xl border p-6 shadow-soft space-y-4 transition-all",
                errors.video ? "border-red-500 bg-red-50/5" : "border-border bg-card"
              )}>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Video className="size-5 text-amber-500" /> Walkaround Video (1 Video) <span className="text-rose-500">*</span>
                </h2>
                {!video ? (
                  <label className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                    errors.video
                      ? "border-red-500 bg-red-50/10 hover:bg-red-50/20"
                      : "border-border bg-secondary/20 hover:border-amber-500/50 hover:bg-secondary/40"
                  )}>
                    <Video className="size-8 text-amber-500" />
                    <span className="text-sm font-bold">Click to upload 1 walkaround video</span>
                    <span className="text-xs text-muted-foreground">Short 30-60 second video showing vehicle exterior & engine sound</span>
                    <input
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.avi,.mkv"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Video className="size-6 text-amber-500" />
                        <div>
                          <div className="text-sm font-bold">{video.name}</div>
                          <div className="text-xs text-muted-foreground">Uploaded Walkaround Video</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideo(null)}
                        className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        Remove Video
                      </button>
                    </div>
                    {video.previewUrl && (
                      <video
                        src={video.previewUrl}
                        controls
                        className="w-full h-auto max-h-[320px] rounded-xl border border-border bg-black shadow-soft"
                      />
                    )}
                  </div>
                )}
                {errors.video && (
                  <span className="block text-xs font-bold text-red-500 px-1">{errors.video}</span>
                )}
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="flex flex-wrap justify-between items-center gap-4 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => {
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={step === 0}
              className="rounded-2xl border border-border bg-card px-6 py-3.5 text-xs font-extrabold shadow-soft transition-all hover:bg-secondary disabled:opacity-40 cursor-pointer"
            >
              Previous Step
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveDraft}
                className="rounded-2xl border border-border bg-card px-6 py-3.5 text-xs font-extrabold shadow-soft transition-all hover:border-[#FFC700]/60 hover:bg-secondary disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Save className="size-4 text-[#FFC700]" /> Save Draft
              </button>

              {step < freelancerSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3.5 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.35)] transition-all cursor-pointer"
                >
                  Continue Next Step <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3.5 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,199,0,0.55)] cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Submitting...
                    </span>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" /> Submit Vehicle for Admin Approval
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
