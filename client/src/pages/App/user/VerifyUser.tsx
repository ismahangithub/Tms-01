import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import IconEdit from "../../../components/Icon/IconEdit";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "User" | "Admin";
}

interface VerifyUserDialogProps {
  onUserVerified: (user: User) => void;
}

export function VerifyUserDialog({ onUserVerified }: VerifyUserDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleVerify = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`/api/users/verify/${email}`);
      if (response.status === 200 && response.data.user) {
        onUserVerified(response.data.user);
        toast.success("User found! Loading details...");
        setIsAlertOpen(false); // Close dialog on success
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to find user. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AlertDialog
        open={isAlertOpen}
        onOpenChange={(open) => {
          setIsAlertOpen(open);
          if (!open) {
            setEmail(""); // Reset email field when dialog closes
            setLoading(false); // Reset loading state
          }
        }}
      >
        <AlertDialogTrigger asChild>
          <Button
            className="relative w-full md:w-auto flex items-center justify-center rounded-md border px-5 py-2 text-sm font-semibold shadow-[0_10px_20px_-10px] outline-none transition duration-300 hover:shadow-none bg-[#2196f3] text-white shadow-info/60"
          >
            <span className="pr-2">
              <IconEdit />
            </span>
            Edit User
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify User</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the email of the user you want to edit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Input
              placeholder="User Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <Button
              onClick={() => setIsAlertOpen(false)}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={loading || !email.trim()}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
