"use client";

import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    profileSchema,
    whatsappSchema,
    setPasswordSchema,
    updatePasswordSchema,
    ProfileFormValues,
    WhatsappFormValues,
    SetPasswordFormValues,
    UpdatePasswordFormValues,
} from "@/types/schema/profile";
import {
    Camera,
    KeyRound,
    Phone,
    Eye,
    EyeOff,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    whatsappNumber: string | null;
    isWhatsappPublic: boolean;
    isProfileCompleted: boolean;
    isPasswordSet: boolean;
}

function PasswordInput({ field, placeholder }: { field: any; placeholder?: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Input type={show ? "text" : "password"} placeholder={placeholder} {...field} />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

export default function UserProfilePage() {
    const isMobile = useIsMobile();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [avatarBase64, setAvatarBase64] = useState<string>("");

    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileError, setProfileError] = useState("");

    const [whatsappLoading, setWhatsappLoading] = useState(false);
    const [whatsappSaved, setWhatsappSaved] = useState(false);
    const [whatsappError, setWhatsappError] = useState("");

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSaved, setPasswordSaved] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const router = useRouter();
    const { update } = useSession();

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        mode: "onSubmit",
        reValidateMode: "onBlur",
        defaultValues: { name: "", imageUrl: "" },
    });

    const whatsappForm = useForm<WhatsappFormValues>({
        resolver: zodResolver(whatsappSchema),
        mode: "onBlur",
        reValidateMode: "onBlur",
        defaultValues: { whatsappNumber: "", isWhatsappPublic: false },
    });

    const setPasswordForm = useForm<SetPasswordFormValues>({
        resolver: zodResolver(setPasswordSchema),
        mode: "onSubmit",
        reValidateMode: "onBlur",
        defaultValues: { password: "", confirmPassword: "" },
    });

    const updatePasswordForm = useForm<UpdatePasswordFormValues>({
        mode: "onSubmit",
        reValidateMode: "onBlur",
        resolver: zodResolver(updatePasswordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                const json = await res.json();
                const user: UserProfile = json.data?.user;

                setUserData(user);

                //  Pre-fill profile form with backend data
                profileForm.reset({
                    name: user.name ?? "",
                    imageUrl: user.image ?? "",
                });

                whatsappForm.reset({
                    whatsappNumber: user.whatsappNumber ?? "",
                    isWhatsappPublic: user.isWhatsappPublic ?? false,
                });

                if (user.image) setAvatarPreview(user.image);
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setIsFetching(false);
            }
        };

        fetchProfile();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setAvatarPreview(base64);  // show new image immediately
            setAvatarBase64(base64);   // hold for submission
        };
        reader.readAsDataURL(file);
    };

    const onProfileSubmit = async (values: ProfileFormValues) => {
        setProfileLoading(true);
        setProfileError("");
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: values.name,
                    
                    ...(avatarBase64 && { imageUrl: avatarBase64 }),
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                setProfileError(json.message || "Failed to update profile");
                return;
            }

            console.log(json);

            await update({
                user: {
                    ...userData,
                    name: json.data?.user?.name,
                    image: json.data?.user?.image,
                }
            });
            router.refresh();

            if (json.data?.user?.image) {
                setAvatarPreview(json.data.user.image);
                setAvatarBase64("");
            }

            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 3000);
        } catch {
            setProfileError("Something went wrong. Please try again.");
        } finally {
            setProfileLoading(false);
        }
    };

    const onWhatsappSubmit = async (values: WhatsappFormValues) => {
        setWhatsappLoading(true);
        setWhatsappError("");
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    whatsappNumber: values.whatsappNumber,
                    isWhatsappPublic: values.isWhatsappPublic,
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                setWhatsappError(json.message || "Failed to update WhatsApp settings");
                return;
            }

            setWhatsappSaved(true);
            setTimeout(() => setWhatsappSaved(false), 3000);
        } catch {
            setWhatsappError("Something went wrong. Please try again.");
        } finally {
            setWhatsappLoading(false);
        }
    };

    const onSetPasswordSubmit = async (values: SetPasswordFormValues) => {
        setPasswordLoading(true);
        setPasswordError("");
        try {
            const res = await fetch("/api/user/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: values.password }),
            });

            const json = await res.json();
            if (!res.ok) {
                setPasswordError(json.message || "Failed to set password");
                return;
            }

            setPasswordSaved(true);
            setPasswordForm.reset();
            setUserData((prev) => prev ? { ...prev, isPasswordSet: true } : prev);
            setTimeout(() => setPasswordSaved(false), 3000);
        } catch {
            setPasswordError("Something went wrong. Please try again.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const onUpdatePasswordSubmit = async (values: UpdatePasswordFormValues) => {
        setPasswordLoading(true);
        setPasswordError("");
        try {
            const { confirmPassword, ...payload } = values;
            const res = await fetch("/api/user/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                setPasswordError(json.message || "Failed to change password");
                return;
            }

            setPasswordSaved(true);
            updatePasswordForm.reset();
            setTimeout(() => setPasswordSaved(false), 3000);
        } catch(err) {
          console.error("update password error: ", err)
            setPasswordError("Something went wrong. Please try again.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const watchedName = profileForm.watch("name");

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <Separator />

                <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-2")}>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Profile Info</CardTitle>
                            <CardDescription>Update your photo and display name.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">

                                    <div className="flex flex-col items-center gap-3">
                                        <div className="relative group">
                                            <Avatar className="h-20 w-20">
                                                <AvatarImage src={avatarPreview} className="object-contain"/>
                                                <AvatarFallback className="text-xl">
                                                    {watchedName?.[0]?.toUpperCase() ||
                                                        userData?.email?.[0]?.toUpperCase() ||
                                                        "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Camera className="h-5 w-5 text-white" />
                                            </button>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs"
                                        >
                                            <Camera className="h-2 w-2 mr-1.5" />
                                            Change Photo
                                        </Button>
                                    </div>

                                    <Separator />

                                    <FormField
                                        control={profileForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Username</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Your display name"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    This is your public display name.
                                                </FormDescription>
                                                <FormMessage className="text-xs"/>
                                            </FormItem>
                                        )}
                                    />

                                    {profileError && (
                                        <p className="text-sm text-destructive">{profileError}</p>
                                    )}

                                    <div className="flex items-center justify-end gap-3">
                                        <Button type="submit" size="sm" disabled={profileLoading}>
                                            {profileLoading && (
                                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            )}
                                            Save Profile
                                        </Button>
                                        {profileSaved && (
                                            <span className="flex items-center gap-1 text-sm text-green-600">
                                                <CheckCircle2 className="h-4 w-4" /> Saved
                                            </span>
                                        )}
                                    </div>

                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Email</CardTitle>
                          <CardDescription>{userData?.email}</CardDescription>
                        </CardHeader>
                      </Card>
                      <Card>
                          <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <CardTitle className="text-base">WhatsApp Settings</CardTitle>
                              </div>
                              <CardDescription>
                                  Configure your WhatsApp contact preferences.
                              </CardDescription>
                          </CardHeader>
                          <CardContent>
                              <Form {...whatsappForm}>
                                  <form onSubmit={whatsappForm.handleSubmit(onWhatsappSubmit)} className="space-y-5">

                                      <FormField
                                          control={whatsappForm.control}
                                          name="whatsappNumber"
                                          render={({ field }) => (
                                              <FormItem>
                                                  <FormLabel>WhatsApp Number</FormLabel>
                                                  <FormControl>
                                                      <Input
                                                          type="tel"
                                                          placeholder="12345678900"
                                                          {...field}
                                                          value={field.value ?? ""}
                                                      />
                                                  </FormControl>
                                                  <FormMessage className="text-xs"/>
                                              </FormItem>
                                          )}
                                      />

                                      <FormField
                                          control={whatsappForm.control}
                                          name="isWhatsappPublic"
                                          render={({ field }) => (
                                              <FormItem>
                                                  <div className="flex items-start gap-3 rounded-md border p-3 bg-muted/40">
                                                      <FormControl>
                                                          <Checkbox
                                                              checked={field.value ?? false}
                                                              onCheckedChange={field.onChange}
                                                              className="mt-0.5 border-neutral-400"
                                                          />
                                                      </FormControl>
                                                      <div className="space-y-1">
                                                          <FormLabel className="font-medium cursor-pointer">
                                                              WhatsApp Public
                                                          </FormLabel>
                                                          <FormDescription className="text-xs leading-snug">
                                                              If enabled, other people can see your WhatsApp credentials.
                                                          </FormDescription>
                                                      </div>
                                                  </div>
                                                  <FormMessage className="text-xs"/>
                                              </FormItem>
                                          )}
                                      />

                                      {whatsappError && (
                                          <p className="text-sm text-destructive">{whatsappError}</p>
                                      )}

                                      <div className="flex items-center justify-end gap-3">
                                          <Button type="submit" size="sm" disabled={whatsappLoading}>
                                              {whatsappLoading && (
                                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                              )}
                                              Update Settings
                                          </Button>
                                          {whatsappSaved && (
                                              <span className="flex items-center gap-1 text-sm text-green-600">
                                                  <CheckCircle2 className="h-4 w-4" /> Saved
                                              </span>
                                          )}
                                      </div>

                                  </form>
                              </Form>
                          </CardContent>
                      </Card>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">
                                {userData?.isPasswordSet ? "Change Password" : "Create a Password"}
                            </CardTitle>
                        </div>
                        <CardDescription>
                            {userData?.isPasswordSet
                                ? "Update your existing password."
                                : "You haven't set a password yet. Add one to secure your account."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>

                        {!userData?.isPasswordSet ? (
                            <Form {...setPasswordForm}>
                                <form
                                    onSubmit={setPasswordForm.handleSubmit(onSetPasswordSubmit)}
                                    className="space-y-4"
                                >
                                    <div className={cn("grid gap-4", !isMobile && "grid-cols-2")}>
                                        <FormField
                                            control={setPasswordForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <PasswordInput field={field} placeholder="Min. 6 characters" />
                                                    </FormControl>
                                                    <FormMessage className="h-[18px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={setPasswordForm.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Confirm Password</FormLabel>
                                                    <FormControl>
                                                        <PasswordInput field={field} placeholder="Repeat password" />
                                                    </FormControl>
                                                    <FormMessage className="h-[18px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {passwordError && (
                                        <p className="text-sm text-destructive">{passwordError}</p>
                                    )}

                                    <div className="flex items-center justify-end gap-3">
                                        <Button type="submit" size="sm" disabled={passwordLoading}>
                                            {passwordLoading && (
                                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            )}
                                            Set Password
                                        </Button>
                                        {passwordSaved && (
                                            <span className="flex items-center gap-1 text-sm text-green-600">
                                                <CheckCircle2 className="h-4 w-4" /> Password set
                                            </span>
                                        )}
                                    </div>
                                </form>
                            </Form>

                        ) : (
                            <Form {...updatePasswordForm}>
                                <form
                                    onSubmit={updatePasswordForm.handleSubmit(onUpdatePasswordSubmit)}
                                    className="space-y-4"
                                >
                                    <div className={cn("grid gap-4", !isMobile && "grid-cols-3")}>
                                        <FormField
                                            control={updatePasswordForm.control}
                                            name="currentPassword"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Current Password</FormLabel>
                                                    <FormControl>
                                                        <PasswordInput field={field} placeholder="Current password" />
                                                    </FormControl>
                                                    <FormMessage className="h-[18px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={updatePasswordForm.control}
                                            name="newPassword"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>New Password</FormLabel>
                                                    <FormControl>
                                                        <PasswordInput field={field} placeholder="Min. 6 characters" />
                                                    </FormControl>
                                                    <FormMessage className="h-[18px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={updatePasswordForm.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Confirm Password</FormLabel>
                                                    <FormControl>
                                                        <PasswordInput field={field} placeholder="Repeat new password" />
                                                    </FormControl>
                                                    <FormMessage className="h-[18px]" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {passwordError && (
                                        <p className="text-sm text-destructive">{passwordError}</p>
                                    )}

                                    <div className="flex items-center justify-end gap-3">
                                        <Button type="submit" size="sm" disabled={passwordLoading}>
                                            {passwordLoading && (
                                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            )}
                                            Update Password
                                        </Button>
                                        {passwordSaved && (
                                            <span className="flex items-center gap-1 text-sm text-green-600">
                                                <CheckCircle2 className="h-4 w-4" /> Password changed
                                            </span>
                                        )}
                                    </div>
                                </form>
                            </Form>
                        )}

                    </CardContent>
                </Card>

            </div>
        </div>
    );
}