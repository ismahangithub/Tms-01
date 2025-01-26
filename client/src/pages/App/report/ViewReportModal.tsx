import React from "react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTimes } from "@fortawesome/free-solid-svg-icons";

interface ViewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report;
}

type Report = {
  _id: string;
  title: string;
  content: string;
  scope: string;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
};

const ViewReportModal: React.FC<ViewReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6 bg-white rounded-lg shadow-lg">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold text-[#006272] flex items-center gap-2">
            <FontAwesomeIcon icon={faEye} /> View Report
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700">Title</h3>
            <p className="text-gray-800 text-sm">{report.title}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Content</h3>
            {/* Render content as HTML */}
            <div
              className="text-gray-800 text-sm"
              dangerouslySetInnerHTML={{ __html: report.content }}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Scope</h3>
            <p className="text-gray-800 text-sm">
              {report.scope.charAt(0).toUpperCase() + report.scope.slice(1)}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Created By</h3>
            <p className="text-gray-800 text-sm">
              {report.createdBy.firstName} {report.createdBy.lastName}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Created At</h3>
            <p className="text-gray-800 text-sm">
              {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="px-4 py-2 text-[#006272] border-[#006272]">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewReportModal;
