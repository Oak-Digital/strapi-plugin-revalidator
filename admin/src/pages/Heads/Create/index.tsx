import React from "react";
import {
  HeaderLayout,
  ContentLayout,
  Box,
  Grid,
  GridItem,
  Select,
  Option,
  TextInput,
  Main,
  Button,
  Link,
} from "@strapi/design-system";
import { useIntl } from "react-intl";
import pluginId from "../../../pluginId";
import { request } from "@strapi/helper-plugin";
import { Formik, Form } from "formik";
import { useHeadTypes } from "../../../lib/queries/head-type";
import { Check, ArrowLeft } from "@strapi/icons";

type Inputs = {
  name: string;
  headType: string | null;
  fields?: Record<string, string>;
};

const CreateHeadsPage = () => {
  const { formatMessage } = useIntl();
  const { data: headTypes } = useHeadTypes();
  const headTypesKeys = Object.keys(headTypes || {});
  const initialValues: Inputs = {
    name: "",
    headType: null,
  };

  const onSubmit = async (values: Inputs) => {
    const response = await request(`/${pluginId}/heads`, {
      method: "POST",
      body: values,
    });
  };

  return (
    <Main>
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {({
          handleSubmit,
          values,
          handleChange,
          errors,
          touched,
          isSubmitting,
          setFieldValue,
        }) => (
          <Form onSubmit={handleSubmit}>
            <HeaderLayout
              title={formatMessage({
                id: `${pluginId}.settings.page.heads.create.title`,
                defaultMessage: "Create a new head",
              })}
              subtitle={formatMessage({
                id: `${pluginId}.settings.page.heads.create.description`,
                defaultMessage:
                  "Define endpoints and settings for the heads of this application",
              })}
              primaryAction={
                <Button
                  type="submit"
                  loading={isSubmitting}
                  startIcon={<Check />}
                >
                  {formatMessage({
                    id: "global.save",
                    defaultMessage: "Save",
                  })}
                </Button>
              }
              navigationAction={
                <Link
                  startIcon={<ArrowLeft />}
                  to={`/settings/${pluginId}/patterns`}
                >
                  {formatMessage({
                    id: "global.back",
                    defaultMessage: "Back",
                  })}
                </Link>
              }
            />
            <ContentLayout>
              <Box>
                <Grid gap={4}>
                  <GridItem col={6}>
                    <TextInput
                      name="name"
                      label={formatMessage({
                        id: `${pluginId}.settings.page.heads.create.name`,
                        defaultMessage: "Name",
                      })}
                      value={values.name}
                      onChange={(e: any) =>
                        setFieldValue("name", e.target.value)
                      }
                    />
                  </GridItem>
                  <GridItem col={6}>
                    <Select
                      required
                      error={errors.headType}
                      label="Type"
                      name="headType"
                      value={values.headType}
                      onChange={(value: string) =>
                        setFieldValue("headType", value)
                      }
                    >
                      {headTypesKeys.map((key) => (
                        <Option key={key} value={key}>
                          {key}
                        </Option>
                      ))}
                    </Select>
                  </GridItem>

                  {/* Fields */}
                  {values.headType &&
                    headTypes?.[values.headType].map((field) => (
                      <GridItem col={6} key={`${values.headType}.${field}`}>
                        <TextInput
                          name={field}
                          label={field}
                          value={values.fields?.[field] || ""}
                          onChange={(e: any) =>
                            setFieldValue(`fields.${field}`, e.target.value)
                          }
                        />
                      </GridItem>
                    ))}
                </Grid>
              </Box>
            </ContentLayout>
          </Form>
        )}
      </Formik>
    </Main>
  );
};

export default CreateHeadsPage;
