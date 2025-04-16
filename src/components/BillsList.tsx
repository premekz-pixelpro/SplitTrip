import { useEventStore } from "@/store/useEventStore";
import { BillItem } from "@/components/BillItem"
import { useEffect } from "react";

export const BillsList = () => {

    const { eventBills, fetchBills, loading } = useEventStore();
    const currentEvent = useEventStore(state => state.currentEvent);

    useEffect(() => {
        if (currentEvent) {
            fetchBills(currentEvent.id).then(() =>
           console.log("Bills", eventBills ));
        }
    }, [currentEvent]);
    return (
        <div className="bills-list">BillList
            {loading ? (
                <div>Loading bills...</div>
            ) : eventBills.length === 0 ? (
                <div>No bills available</div>
            ) : (
                <ul className="bills-list">
                    {eventBills.map(bill => (
                        <BillItem key={bill.id} bill={bill} />
                    ))}
                </ul>
            )}
        </div>
    )
}
    