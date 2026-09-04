"use client";

/**
 * Draft a recommendation with Zai.
 *
 * The author gives ONE specific point ("the reset link must not be reusable")
 * and Zai returns a full recommendation. Nothing is added until they accept it:
 * the draft is previewed as the real card first, so the decision is made against
 * what a reader would actually see rather than a wall of JSON.
 *
 * Zai keeps the purple it wears everywhere else in the product.
 */

import React, { useEffect, useState } from "react";
import { Modal, Button, Input, message } from "antd";
import {
  Sparkles,
  RefreshCw,
  Check,
  Wand2,
  Lightbulb,
  Layers,
  Tags,
  Target,
  ListChecks,
  FlaskConical,
  ShieldAlert,
  BookOpen,
} from "lucide-react";

import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { api as axios } from "@/lib/axios";
import { PlaybookItemCard, draftToItem } from "@/components/qa/PlaybookCards";
import { ChipPicker } from "@/components/qa/PlaybookFormBits";
import { type DraftItem } from "@/components/qa/playbookShared";

const { TextArea } = Input;

/**
 * The parts of a recommendation, in the order they are written, with how long
 * each one usually takes.
 *
 * IMPORTANT: this is PACED, not streamed. The API answers in one shot, so these
 * timings describe what the model is producing and roughly when — they are not
 * progress reported by the server. The last part is held until the response
 * actually lands, so the panel never claims to be finished before it is.
 */
const STAGES = [
  {
    key: "context",
    label: "Reading the section",
    hint: "What this playbook already covers, so the card does not repeat it",
    icon: BookOpen,
    ms: 2600,
  },
  {
    key: "what",
    label: "What to test",
    hint: "The behaviour a QA actually exercises",
    icon: Target,
    ms: 7000,
  },
  {
    key: "examples",
    label: "Examples",
    hint: "Concrete inputs, and the verdict for each",
    icon: FlaskConical,
    ms: 7000,
  },
  {
    key: "expected",
    label: "Expected result",
    hint: "What a correct system does",
    icon: Check,
    ms: 6000,
  },
  {
    key: "steps",
    label: "Steps",
    hint: "How to get there, in order",
    icon: ListChecks,
    ms: 6000,
  },
  {
    key: "why",
    label: "Why it matters",
    hint: "The defect this catches, and what it costs",
    icon: ShieldAlert,
    ms: 9000,
  },
];

/** Openers that show the shape of a good point: one behaviour, one failure. */
const STARTERS = [
  "The link must stop working once it has been used",
  "Repeated attempts must be rate limited",
  "The response must not reveal whether the account exists",
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Context Zai writes against, so the draft fits where it will land. */
  playbookName: string;
  sectionTitle: string;
  categoryLabels: Record<string, string>;
  categoryOptions: { value: string; label: string }[];
  levelOptions: { value: string; label: string }[];
  /** Called once the author accepts the draft. */
  onAccept: (item: DraftItem) => void;
}

export default function ZaiRecommendationModal({
  open,
  onClose,
  playbookName,
  sectionTitle,
  categoryLabels,
  categoryOptions,
  levelOptions,
  onAccept,
}: Props) {
  const [point, setPoint] = useState("");
  const [level, setLevel] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<DraftItem | null>(null);
  const [stage, setStage] = useState(0);

  /* Walks the parts while the call is out, and stops on the last one — which
     stays in progress until the answer arrives, however long that takes. */
  useEffect(() => {
    if (!drafting) {
      setStage(0);
      return;
    }
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      if (index >= STAGES.length - 1) return;
      timer = setTimeout(() => {
        index += 1;
        setStage(index);
        advance();
      }, STAGES[index].ms);
    };
    advance();
    return () => clearTimeout(timer);
  }, [drafting]);

  const reset = () => {
    setPoint("");
    setLevel("");
    setCategory("");
    setDraft(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const generate = async () => {
    if (point.trim().length < 8) {
      return message.error("Describe the point in a little more detail");
    }
    try {
      setDrafting(true);
      const result: any = await axios.post(
        "/api/v2/qa/playbooks/ai/draft-recommendation",
        {
          point: point.trim(),
          playbook_name: playbookName || null,
          section_title: sectionTitle || null,
          level: level || null,
          category: category || null,
        },
        // The client's 30s default is too tight here: drafting a full
        // recommendation on a reasoning model runs ~30-40s, so the default
        // aborted the request a moment before the answer arrived.
        { timeout: 120000 }
      );
      setDraft(result.recommendation);
    } catch (err: any) {
      message.error(err?.message || "Zai could not draft that. Try rephrasing the point.");
    } finally {
      setDrafting(false);
    }
  };

  const accept = () => {
    if (!draft) return;
    onAccept(draft);
    message.success("Recommendation added — edit it like any other");
    close();
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      width={720}
      centered
      className="pb-zaimodal"
      title={
        <div className="pb-zai__head">
          <span className="pb-zai__avatar">
            <Sparkles size={17} />
          </span>
          <div className="pb-zai__headtext">
            <div className="pb-zai__title">
              Draft with Zai
              <span className="pb-zai__badge">AI</span>
            </div>
            <div className="pb-zai__sub">
              One specific point in, a full recommendation out — reviewed before it lands.
            </div>
          </div>
          {/* Two steps, and the modal says which one you are on. */}
          <div className="pb-zai__steps">
            <span className={`pb-zai__step ${draft ? "" : "is-on"}`}>
              <b>1</b> Describe
            </span>
            <span className="pb-zai__steparrow">›</span>
            <span className={`pb-zai__step ${draft ? "is-on" : ""}`}>
              <b>2</b> Review
            </span>
          </div>
        </div>
      }
      footer={
        draft ? (
          <div className="pb-zai__foot">
            <span className="pb-zai__foothint">Nothing is added until you say so.</span>
            <Button className="pb-btn" onClick={() => setDraft(null)}>
              Back
            </Button>
            <Button
              className="pb-btn"
              icon={<RefreshCw size={13} />}
              loading={drafting}
              onClick={generate}
            >
              Regenerate
            </Button>
            <Button
              type="primary"
              className="pb-btn is-zai"
              icon={<Check size={14} />}
              onClick={accept}
            >
              Add recommendation
            </Button>
          </div>
        ) : (
          <div className="pb-zai__foot">
            <span className="pb-zai__foothint">
              {point.trim().length > 0 ? `${point.trim().length}/1200 characters` : "Takes about half a minute."}
            </span>
            <Button className="pb-btn" onClick={close}>
              Cancel
            </Button>
            <Button
              type="primary"
              className="pb-btn is-zai"
              icon={<Wand2 size={14} />}
              loading={drafting}
              disabled={point.trim().length < 8}
              onClick={generate}
            >
              Draft it
            </Button>
          </div>
        )
      }
    >
      {drafting && !draft ? (
        /* ~30-40s on a reasoning model. A one-line "please wait" left the modal
           looking hung, so the wait gets the shape of what is coming. */
        <div className="pb-zai pb-zai--waiting">
          <div className="pb-zai__waithead">
            <div className="pb-zai__spinner">
              <Sparkles size={19} />
            </div>
            <div className="pb-zai__waittext">
              <div className="pb-zai__waittitle">Writing your recommendation</div>
              <div className="pb-zai__waitsub">
                Zai is building the card part by part — about half a minute.
              </div>
            </div>
            <div className="pb-zai__waitpct">
              {Math.round(((stage + 1) / (STAGES.length + 1)) * 100)}%
            </div>
          </div>

          <div className="pb-zai__track">
            <span
              className="pb-zai__trackfill"
              style={{ width: `${((stage + 1) / (STAGES.length + 1)) * 100}%` }}
            />
          </div>

          <ol className="pb-zai__stages">
            {STAGES.map((item, index) => {
              const state = index < stage ? "is-done" : index === stage ? "is-live" : "is-next";
              const Icon = item.icon;
              return (
                <li key={item.key} className={`pb-zai__stage ${state}`}>
                  <span className="pb-zai__stageicon">
                    {index < stage ? <Check size={13} /> : <Icon size={13} />}
                  </span>
                  <span className="pb-zai__stagetext">
                    <b>{item.label}</b>
                    <em>{item.hint}</em>
                    {index === stage && (
                      <span className="pb-zai__stagelines">
                        <span style={{ width: "88%" }} />
                        <span style={{ width: "64%" }} />
                      </span>
                    )}
                  </span>
                  {index === stage && <span className="pb-zai__stagedots" aria-hidden />}
                </li>
              );
            })}
          </ol>

          <p className="pb-zai__waitfoot">
            You will see the finished card before anything is added to the playbook.
          </p>
        </div>
      ) : !draft ? (
        <div className="pb-zai">
          <div className="pb-zai__tip">
            <Lightbulb size={15} />
            <span>
              The narrower the point, the better the card —{" "}
              <em>&ldquo;the reset link must not work twice&rdquo;</em> beats &ldquo;test
              password reset&rdquo;.
            </span>
          </div>

          <label className="pb-ask__field">
            <span className="pb-ask__label">
              <Sparkles size={13} />
              The point to cover
              <em>required</em>
            </span>
            <TextArea
              value={point}
              onChange={(e) => setPoint(e.target.value)}
              placeholder="e.g., A reset link should stop working the moment it has been used once"
              autoSize={{ minRows: 3, maxRows: 8 }}
              maxLength={1200}
              className="pb-ask__input"
              autoFocus
            />
            {sectionTitle && (
              <span className="pb-ask__help">
                Zai writes it for the <b>{sectionTitle}</b> section of{" "}
                {playbookName || "this playbook"}, so it fits where it will land.
              </span>
            )}
            <div className="pb-ask__suggest">
              <span className="pb-ask__suggestlabel">Try</span>
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className="pb-ask__chip"
                  onClick={() => setPoint(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </label>

          <div className="pb-zai__row">
            <label className="pb-ask__field">
              <span className="pb-ask__label">
                <Layers size={13} />
                Level
              </span>
              <ChipPicker
                value={level}
                options={[{ value: "", label: "Let Zai choose" }, ...levelOptions]}
                onChange={setLevel}
              />
            </label>

            <label className="pb-ask__field">
              <span className="pb-ask__label">
                <Tags size={13} />
                Category
              </span>
              <SearchableDropdown
                value={category || null}
                onChange={(value: string) => setCategory(value || "")}
                options={[{ value: "", label: "Let Zai choose" }, ...categoryOptions]}
                placeholder="Let Zai choose"
                searchPlaceholder="Search categories"
              />
              <span className="pb-ask__help">
                Leave both unset and Zai picks what fits the point.
              </span>
            </label>
          </div>
        </div>
      ) : (
        <div className="pb-zai">
          <div className="pb-zai__ready">
            <Check size={14} />
            Draft ready — this is the card a reader would see. Add it and edit like any
            other, or regenerate if it missed the point.
          </div>
          {/* The reader's own card — see PlaybookCards.tsx. */}
          <div className="pb-zai__result">
            <PlaybookItemCard item={draftToItem(draft, "zai")} categoryLabels={categoryLabels} />
          </div>
        </div>
      )}
    </Modal>
  );
}
